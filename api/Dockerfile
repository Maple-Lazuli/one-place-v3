FROM python:3.11-slim

# Install uv (fast Rust-based Python installer)
RUN pip install --upgrade pip && pip install uv

# Set working dir inside the container
WORKDIR /app

# Copy dependency files first to use Docker cache
COPY pyproject.toml uv.lock ./

# Install project dependencies
RUN uv pip install --system --no-deps . && uv pip install --system --dev

# Copy the full project code
COPY . .

# Expose port 3001 for Flask
EXPOSE 3001

# Run your app
CMD ["python", "run.py"]
