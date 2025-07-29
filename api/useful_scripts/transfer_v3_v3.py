import argparse
import os
import time
import shutil

os.makedirs('temp', exist_ok=True)

import requests as r
import json
import re

from pprint import pprint


def canary(res):
    if res.status_code != 200:
        print(res)
        res = res.json()
        pprint(res)
        raise ValueError("Canary!")
    return res.json()


def replace_canvas_images(content, src_address, src_cookie, dst_address, dst_cookie):
    parsed_content = json.loads(content)
    for image in parsed_content['images']:
        src_res = r.get(src_address + "/images/image", params={"id": image['id']}, cookies=src_cookie)
        if src_res.status_code != 200:
            print("issue getting image")
            raise ValueError("Canary!")

        with open("temp/temp.png", "wb") as file_out:
            file_out.write(src_res.content)

        with open("temp/temp.png", "rb") as new_image:
            files = {"file": new_image}

            dst_res = r.post(dst_address + "/images/image", files=files, cookies=dst_cookie)
            dst_id = canary(dst_res)['id']

        image['id'] = dst_id

    return json.dumps(parsed_content)


def translate_images(origional_link, src_address, src_cookie, dst_address, dst_cookie, dst_ip):
    time.sleep(.01)
    source_id = origional_link.split("=")[-1]
    src_res = r.get(src_address + "/images/image", params={"id": source_id}, cookies=src_cookie)
    if src_res.status_code != 200:
        print("issue getting image")
        raise ValueError("Canary!")

    with open("temp/temp.png", "wb") as file_out:
        file_out.write(src_res.content)

    with open("temp/temp.png", "rb") as image:
        files = {"file": image}

        dst_res = r.post(dst_address + "/images/image", files=files, cookies=dst_cookie)
    dst_id = canary(dst_res)['id']

    print(f"Created image ID: {dst_id} on Destination.")

    return f'http://{dst_ip}/api/images/image?id={dst_id}'


def process_markdown_images(markdown, translate_images, src_address, src_cookie, dst_address, dst_cookie, dst_ip):
    # Pattern to match ![image](http://<host>/api/images/image?id=123)
    pattern = re.compile(r'!\[image\]\((http[s]?://[^)]+/api/images/image\?id=\d+)\)')

    def replacer(match):
        original_link = match.group(1)
        new_link = translate_images(original_link, src_address, src_cookie, dst_address, dst_cookie, dst_ip)
        return f'![image]({new_link})'

    return pattern.sub(replacer, markdown)


def main(dst_username, dst_password, dst_ip, src_username, src_password, src_ip, delete_dst_user):
    src_address = f"http://{src_ip}:3001/"

    dst_address = f"http://{dst_ip}:3001/"

    # src_res = r.post(src_address + "/users/create_user", json={
    #     "username": src_username,
    #     "password": src_password
    # })
    # src_res = src_res.json()

    src_res = r.post(src_address + "/users/login", json={
        "username": src_username,
        "password": src_password
    })
    src_json = src_res.json()
    if src_json['message'] == "Authenticated Successfully":
        print("Authenticated With Source")
    else:
        print(f"Could Not Authenticate with Source: {src_username}@{src_password}")
        print(src_json)
        return
    src_cookie = {'token': src_res.cookies['token']}

    if delete_dst_user:
        dst_res = r.post(dst_address + "/users/login", json={
            "username": dst_username,
            "password": dst_password
        })
        dst_json = dst_res.json()
        if dst_json['message'] == "Authenticated Successfully":
            print("Authenticated With Destination To Delete Account")
            dst_cookie = {'token': dst_res.cookies['token']}
            dst_res = r.delete(dst_address + "/users/delete", json={
                "username": dst_username,
                "password": dst_password}, cookies=dst_cookie)
            dst_res = dst_res.json()
            if dst_res['status'] == "success":
                print(f"Deleted Destination User: {dst_username}@{dst_ip}")

            dst_res = r.post(dst_address + "/users/create_user", json={
                "username": dst_username,
                "password": dst_password
            })
            dst_res = dst_res.json()
            if dst_res['status'] == "success":
                print(f"Created Destination User: {dst_username}@{dst_ip}")
        else:
            print("Could Not Authenticate To Delete Account")
    else:
        print("Proceeding without deleting destination")

    dst_res = r.post(dst_address + "/users/login", json={
        "username": dst_username,
        "password": dst_password
    })
    dst_json = dst_res.json()
    if dst_json['message'] == "Authenticated Successfully":
        print("Authenticated With Source")
    else:
        print(f"Could Not Authenticate with Source: {dst_username}@{dst_password}")
        print(dst_json)
        return
    dst_cookie = {'token': dst_res.cookies['token']}

    src_res = r.get(src_address + "/projects/get_all", cookies=src_cookie)
    src_res = src_res.json()
    src_projects = src_res['message'][::-1]

    print(f"{len(src_projects)} Projects To Transfer")

    src_res = r.get(src_address + "/tags/get", cookies=src_cookie)
    src_res = src_res.json()
    src_tags = src_res['message']

    print(f"{len(src_tags)} Tags To Transfer")

    tag_mapping = dict()

    for tag in src_tags:
        dst_res = r.post(dst_address + "/tags/create", json={
            "tag": tag['tag'],
            "options": tag['options']}, cookies=dst_cookie)
        dst_tag = dst_res.json()
        print(f"Created tag: {tag['tag']} on Destination.")
        tag_mapping[tag['TagID']] = dst_tag['id']

    for idx, project in enumerate(src_projects):
        print(f"Progress: {idx / len(src_projects) * 100}%")
        time.sleep(.01)
        # Create new project in DST and get the id
        dst_res = r.post(dst_address + "/projects/create", json={
            "project_name": project['name'],
            "project_description": project['description']}, cookies=dst_cookie)
        dst_res = canary(dst_res)
        print(f"Created project: {project['name']} on Destination.")
        dst_project_id = dst_res['id']

        # Check to see if there are tags in assigned to the source.
        src_res = r.get(src_address + "/tags/get_by_project", params={"project_id": project['ProjectID']},
                        cookies=src_cookie)
        src_tags = canary(src_res)['message']
        if len(src_tags) > 0:
            for tag in src_tags:
                res = r.post(dst_address + "/tags/assign",
                             json={'tag_id': tag_mapping[tag['TagID']], "project_id": dst_project_id, },
                             cookies=dst_cookie)
                canary(res)

        # Get Src Project Todos to Recreate
        src_res = r.get(src_address + "/todo/get_project_todo", params={"project_id": project['ProjectID']},
                        cookies=src_cookie)
        src_todos = canary(src_res)['message']
        for todo in src_todos:
            time.sleep(.01)
            dst_res = r.post(dst_address + "/todo/create", json={
                "project_id": dst_project_id,
                "name": todo['name'],
                "description": todo['description'],
                "dueTime": todo['dueTime'],
                "recurring": todo['recurring'],
                "interval": todo['interval']}, cookies=dst_cookie)
            new_todo_id = canary(dst_res)['id']

            print(f"Created todo: {todo['name']} on Destination.")
            if todo['completed']:
                dst_res = r.patch(dst_address + "/todo/completed_previously", json={
                    "todo_id": new_todo_id,
                    "completion_time": todo['timeCompleted']}, cookies=dst_cookie)
                canary(dst_res)

        # Get Src Project Events to Recreate
        src_res = r.get(src_address + "/events/get_project_events", params={"project_id": project['ProjectID']},
                        cookies=src_cookie)
        src_events = canary(src_res)['message']

        for event in src_events:
            time.sleep(.01)
            dst_res = r.post(dst_address + "/events/create", json={
                "project_id": dst_project_id,
                "name": event['name'],
                "description": event['description'],
                "startTime": event['startTime'],
                "endTime": event['endTime']}, cookies=dst_cookie)
            new_event_id = canary(dst_res)['id']
            canary(dst_res)
            print(f"Created event: {event['name']} on Destination.")

        # Create Src Pages in the project
        src_res = r.get(src_address + "/pages/get_project_pages", params={"id": project['ProjectID']},
                        cookies=src_cookie)
        src_pages = canary(src_res)['message']
        for page in src_pages:
            time.sleep(.01)
            src_page_id = page['PageID']

            # have to get source content.
            src_res = r.get(src_address + "/pages/get", params={"id": src_page_id}, cookies=src_cookie)
            content = canary(src_res)['message']['content']

            translated_page_content = process_markdown_images(content, translate_images, src_address, src_cookie,
                                                              dst_address, dst_cookie, dst_ip)

            dst_res = r.post(dst_address + "/pages/create", json={"project_id": dst_project_id, "name": page['name']},
                             cookies=dst_cookie)
            dst_page_id = canary(dst_res)['id']

            print(f"Created page: {page['name']} on Destination.")

            dst_res = r.put(dst_address + "/pages/content",
                            json={"page_id": dst_page_id, "content": translated_page_content}, cookies=dst_cookie)
            canary(dst_res)

            # Page Code Snippets:
            src_res = r.get(src_address + "/code_snippet/get_all_by_page", params={"id": src_page_id},
                            cookies=src_cookie)
            src_code_snippets = canary(src_res)['message']

            for snippet in src_code_snippets:
                time.sleep(.01)
                dst_res = r.post(dst_address + "/code_snippet/create", json={
                    "page_id": dst_page_id,
                    "name": snippet['name'],
                    "description": snippet['description'],
                    "language": snippet['language'],
                    "content": snippet['content']}, cookies=dst_cookie)
                canary(dst_res)

                print(f"Created snippet: {snippet['name']} on Destination.")

            # Page Recipes
            src_res = r.get(src_address + "/recipes/get_all_by_page", params={"id": src_page_id}, cookies=src_cookie)
            src_recipes = canary(src_res)['message']

            for recipe in src_recipes:
                time.sleep(.01)
                translated_recipe_content = process_markdown_images(recipe['content'], translate_images, src_address,
                                                                    src_cookie, dst_address, dst_cookie, dst_ip)
                dst_res = r.post(dst_address + "/recipes/create", json={
                    "page_id": dst_page_id,
                    "name": recipe['name'],
                    "description": recipe['description'],
                    "content": translated_recipe_content}, cookies=dst_cookie)
                canary(dst_res)

                print(f"Created recipe: {recipe['name']} on Destination.")

            # Page Equations
            src_res = r.get(src_address + "/equations/get_all_by_page", params={"id": src_page_id}, cookies=src_cookie)
            src_equations = canary(src_res)['message']

            for equation in src_equations:
                time.sleep(.01)
                dst_res = r.post(dst_address + "/equations/create", json={
                    "page_id": dst_page_id,
                    "name": equation['name'],
                    "description": equation['description'],
                    "content": equation['content']}, cookies=dst_cookie)
                canary(dst_res)

                print(f"Created equation: {equation['name']} on Destination.")

            # Page Canvas
            src_res = r.get(src_address + "/canvas/get_all_by_page", params={"id": src_page_id}, cookies=src_cookie)
            src_canvases = canary(src_res)['message']

            for canvas in src_canvases:
                src_res = r.get(src_address + "/canvas/get", params={"id": canvas['CanvasID']}, cookies=src_cookie)
                content = canary(src_res)['message']['content']
                content = replace_canvas_images(content, src_address, src_cookie, dst_address, dst_cookie)
                time.sleep(.01)
                dst_res = r.post(dst_address + "/canvas/create", json={
                    "page_id": dst_page_id,
                    "name": canvas['name'],
                    "description": canvas['description'],
                    "content": content}, cookies=dst_cookie)
                canary(dst_res)

                print(f"Created canvas: {canvas['name']} on Destination.")

            # Page translations
            src_res = r.get(src_address + "/translations/get_all_by_page", params={"id": src_page_id},
                            cookies=src_cookie)
            src_translations = canary(src_res)['message']

            for translation in src_translations:
                src_res = r.get(src_address + "/translations/get", params={"id": translation['TranslationID']},
                                cookies=src_cookie)
                content = canary(src_res)['message']['content']
                if content is None:
                    continue
                time.sleep(.01)
                translated_translation_content = process_markdown_images(content, translate_images, src_address,
                                                                         src_cookie, dst_address, dst_cookie, dst_ip)
                dst_res = r.post(dst_address + "/translations/create", json={
                    "page_id": dst_page_id,
                    "language": translation['language']}, cookies=dst_cookie)
                translation_id = canary(dst_res)['id']

                dst_res = r.put(dst_address + "/translations/update", json={
                    "translation_id": translation_id,
                    "new_content": translated_translation_content}, cookies=dst_cookie)
                canary(dst_res)

                print(f"Created translation: {translation['language']} on Destination.")

            # Page Files
            src_res = r.get(src_address + "/files/files_by_page", params={"page_id": src_page_id}, cookies=src_cookie)
            src_files = canary(src_res)

            for file in src_files:
                print(f"Uploading File: {file['name']} from {project['name']}/{page['name']}")
                time.sleep(.01)
                src_res = r.get(src_address + "/files/file", params={"id": file['FileID']}, cookies=src_cookie)
                if src_res.status_code != 200:
                    print("issue with files")
                    raise ValueError("Canary!")
                with open("temp/" + file['filename'], "wb") as file_out:
                    file_out.write(src_res.content)

                with open("temp/" + file['filename'], "rb") as file_to_upload:
                    files = {"file": file_to_upload}
                    data = {
                        "page_id": dst_page_id,
                        "name": file['name'],
                        "description": file['description']}
                    res = r.post(dst_address + "/files/file", data=data, files=files, cookies=dst_cookie)

                print(f"Created file: {file['name']} on Destination.")

    print(f"Progress: {100}%")
    print(f"Destination Username: {dst_username}")
    print(f"Destination Password: {dst_password}")
    if os.path.exists('temp'):
        shutil.rmtree('temp')


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Process some parameters.")
    parser.add_argument("--dst_username", required=True, help="Destination username")
    parser.add_argument("--dst_password", required=True, help="Destination password")
    parser.add_argument("--dst_ip", required=True, help="Destination IP address")

    parser.add_argument("--src_username", required=True, help="Source username")
    parser.add_argument("--src_password", required=True, help="Source password")
    parser.add_argument("--src_ip", required=True, help="Source IP address")
    parser.add_argument(
        "--delete_dst_user",
        action="store_true",
        help="If set, the destination user will be deleted."
    )

    args = parser.parse_args()
    main(args.dst_username.strip(), args.dst_password.strip(), args.dst_ip.strip(), args.src_username.strip(),
         args.src_password.strip(), args.src_ip.strip(),
         args.delete_dst_user)
