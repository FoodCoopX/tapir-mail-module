FROM python:3.11

ENV PYTHONUNBUFFERED=1
ENV DJANGO_SETTINGS_MODULE=tapir_mail_server.settings

WORKDIR /app

# Install system packages and clean up afterwards
RUN apt update -y && apt upgrade -y && \
    apt install -y libldap2-dev libsasl2-dev gettext default-jdk && \
    curl -sL https://deb.nodesource.com/setup_20.x | bash - && \
    apt install -y nodejs && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Upgrade pip and install poetry
RUN pip install --upgrade pip && \
    pip install poetry

# Copy your application files and install Python dependencies
COPY . /app
RUN poetry lock --no-update && \
    poetry install
RUN ./bundle.sh
