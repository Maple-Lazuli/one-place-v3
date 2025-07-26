FROM postgres:15-alpine

ENV POSTGRES_USER=myuser
ENV POSTGRES_PASSWORD=mypassword
ENV POSTGRES_DB=mydatabase

COPY init.sql /docker-entrypoint-initdb.d/

CMD ["postgres", "-c", "max_connections=200", "-c", "max_worker_processes=8", "-c", "max_parallel_workers=4"]
