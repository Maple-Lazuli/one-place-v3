FROM python:3.11-slim

# Install system build dependencies first
RUN apt-get update && apt-get install -y \
    build-essential \
    libpq-dev \
 && rm -rf /var/lib/apt/lists/*

# Install uv package manager
RUN pip install --upgrade pip && pip install uv

WORKDIR /app

COPY pyproject.toml uv.lock ./

# Install project and dependencies (no --no-deps)
RUN uv pip install --system .

COPY . .

RUN uv sync

EXPOSE 3001

# Use uv to run your app
CMD ["uv", "run", "run.py"]
