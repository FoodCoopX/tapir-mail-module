FROM python:3.11

ENV PYTHONUNBUFFERED=1
ENV DJANGO_SETTINGS_MODULE=tapir_mail_server.settings

WORKDIR /app

# Install system packages and clean up afterwards
RUN apt update -y && apt upgrade -y && \
    apt install -y libldap2-dev libsasl2-dev gettext default-jdk ca-certificates curl gnupg && \
    mkdir -p /etc/apt/keyrings && \
    curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key | gpg --dearmor -o /etc/apt/keyrings/nodesource.gpg && \
    echo "deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_20.x nodistro main" | tee /etc/apt/sources.list.d/nodesource.list && \
    apt-get update -y && apt-get install -y nodejs && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

RUN npm install -g mjml@4.14.1

# Upgrade pip and install poetry
RUN pip install --upgrade pip && \
    pip install poetry

# Copy your application files and install Python dependencies
COPY . /app
RUN poetry lock --no-update && \
    poetry install
RUN ./bundle.sh
