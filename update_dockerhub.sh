# Build backend image locally
sudo docker build -t lovelylazuli/one-place-v3-db:latest ./db

sudo docker build -t lovelylazuli/one-place-v3-backend:latest ./api


# Build nginx image locally
sudo docker build -t lovelylazuli/one-place-v3-frontend:latest .

# Push the images
sudo docker push lovelylazuli/one-place-v3-db:latest
sudo docker push lovelylazuli/one-place-v3-backend:latest
sudo docker push lovelylazuli/one-place-v3-frontend:latest 
