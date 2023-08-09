# tapir-mail-module
[![Code style: black](https://img.shields.io/badge/code%20style-black-000000.svg)](https://github.com/psf/black)

Mass mailing module for Tapir with MJML mail template editor

## Project setup
Run the following commands after cloning the repo:
```shell
poetry install
pre-commit install
cp .env.dist .env
./bundle.sh
```

Run the following command to run start the webserver:
```shell
poetry run python manage.py runserver
```

### Run with docker
Start the server:
```shell
docker compose up
```

Access it on [http://localhost:8000]

## React UI
The React UI src is located in /tapir_mail_ui.

Run the `bundle.sh` script to build the react app and copy the static files to the django module.

During development, you can just use `npm run` and have the React and Django dev servers side by side.
Access the UI on [http://localhost:3000]
