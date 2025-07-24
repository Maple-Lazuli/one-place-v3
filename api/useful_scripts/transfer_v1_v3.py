import argparse
import requests as r
import shutil
import json
import zipfile
import pickle
from io import BytesIO
import time
import re
import os

# Ensure temp directory exists
os.makedirs('temp', exist_ok=True)


def create_image(image_handle, dst_address, dst_ip, cookie):
    files = {"file": image_handle}
    res = r.post(dst_address + "/images/image", files=files, cookies=cookie)
    if res.status_code != 200:
        print("Failed to upload image.")
        return ""
    else:
        print("Uploaded Image")
    image_id = res.json()['id']
    return f"http://{dst_ip}/api/images/image?id={image_id}"


def process_markdown_images(markdown_text, source_file, dst_address, dst_ip, cookie):
    if not isinstance(markdown_text, str):
        print(f"Expected string, got {type(markdown_text)}")
        return ""

    pattern = re.compile(
        r'!\[(.*?)\]\((https?://[^)]*/images\?image=([a-fA-F0-9]+))\)'
    )

    def replacer(match):
        alt_text, full_url, image_id = match.groups()
        image_path = os.path.join("images", f"{image_id}.png")

        with zipfile.ZipFile(source_file, 'r') as zip_ref:
            with zip_ref.open(image_path) as file_handle:
                content = file_handle.read()
            with open("temp/" + f"{image_id}.png", "wb") as file_out:
                file_out.write(content)
            with open("temp/" + f"{image_id}.png", "rb") as image_handle:
                new_url = create_image(image_handle, dst_address, dst_ip, cookie)

        return f"![{alt_text}]({new_url})"

    return pattern.sub(replacer, markdown_text)


def main(dst_username, dst_password, dst_ip, source_file):
    dst_address = f"http://{dst_ip}:3001"

    res = r.get(dst_address + "/users/test")
    if res.json().get('test') != "Users Endpoint Reached.":
        print("Could not reach user endpoint.")
        return

    r.post(dst_address + "/users/create_user", json={
        "username": dst_username,
        "password": dst_password
    })

    res = r.post(dst_address + "/users/login", json={
        "username": dst_username,
        "password": dst_password
    })

    if res.status_code != 200 or res.json().get('message') != "Authenticated Successfully":
        print("Could Not Authenticate")
        return
    else:
        print("Authenticated")

    cookie = {'token': res.cookies['token']}

    with zipfile.ZipFile(source_file, 'r') as zip_ref:
        for file_name in zip_ref.namelist():
            if file_name.endswith('content.pkl'):
                with zip_ref.open(file_name) as pkl_file:
                    content = pickle.load(pkl_file)
                break
        else:
            print("content.pkl not found in the zip.")
            return

    projects = [content[key] for key in content]

    for project in projects:
        time.sleep(.1)
        res = r.post(dst_address + "/projects/create", json={
            "project_name": project['title'],
            "project_description": project['purpose'],
        }, cookies=cookie)

        if res.status_code != 200:
            print(f"Failed to create project: {project['title']}")
            continue

        new_project_id = res.json()['id']
        print(f"Created project: {project['title']}")

        for key in project['pages']:
            page = project['pages'][key]
            time.sleep(.1)
            res = r.post(dst_address + "/pages/create", json={
                "project_id": new_project_id,
                "name": page['title'],
            }, cookies=cookie)

            if res.status_code != 200:
                print(f"Failed to create page: {page['title']}")
                continue

            new_page_id = res.json()['id']

            processed_content = process_markdown_images(page['content'], source_file, dst_address, dst_ip, cookie)

            res = r.put(dst_address + "/pages/content", json={
                "page_id": new_page_id,
                "content": processed_content,
            }, cookies=cookie)

            if res.status_code != 200:
                print(f"Failed to update page: {page['title']}")
                continue
            else:
                print(f"Updated page: {page['title']}")

            for snippet in page.get('code_snippets', {}).values():
                time.sleep(.1)
                res = r.post(dst_address + "/code_snippet/create", json={
                    "page_id": new_page_id,
                    "name": snippet['title'],
                    "description": snippet['description'],
                    "language": snippet['language'].lower(),
                    "content": snippet['raw'],
                }, cookies=cookie)

                if res.status_code != 200:
                    print(f"Failed to create snippet: {snippet['title']}")
                else:
                    print(f"Created snippet: {snippet['title']}")

        if project.get('files'):
            res = r.post(dst_address + "/pages/create", json={
                "project_id": new_project_id,
                "name": "Transition File Container",
            }, cookies=cookie)

            if res.status_code != 200:
                print("Failed to create page: Transition File Container")
                continue

            new_page_id = res.json()['id']

            res = r.put(dst_address + "/pages/content", json={
                "page_id": new_page_id,
                "content": "This is a page used to hold file uploads from version 1. Version 3 assigns files to individual pages.",
            }, cookies=cookie)

            for file in project['files'].values():
                time.sleep(.1)
                with zipfile.ZipFile(source_file, 'r') as zip_ref:
                    with zip_ref.open("files/" + file['file_name']) as file_handle:
                        content = file_handle.read()

                temp_path = os.path.join("temp", file['original_file_name'])
                with open(temp_path, "wb") as f:
                    f.write(content)

                with open(temp_path, "rb") as file_to_upload:
                    files = {"file": file_to_upload}
                    data = {
                        "page_id": new_page_id,
                        "name": file['title'],
                        "description": file['description']
                    }
                    res = r.post(dst_address + "/files/file", data=data, files=files, cookies=cookie)

                if res.status_code != 200:
                    print(f"Failed to upload file: {file['title']}")
                else:
                    print(f"Uploaded file: {file['title']}")
    if os.path.exists('temp'):
        shutil.rmtree('temp')


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Process some parameters.")
    parser.add_argument("--dst_username", required=True, help="Destination username")
    parser.add_argument("--dst_password", required=True, help="Destination password")
    parser.add_argument("--dst_ip", required=True, help="Destination IP address")
    parser.add_argument("--source_file", required=True, help="Path to source zip file")

    args = parser.parse_args()
    main(args.dst_username, args.dst_password, args.dst_ip, args.source_file)
