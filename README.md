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

### Run dev environment with docker
Start the Django and React dev servers:
```shell
docker compose up
```

Access the UI dev server on [http://localhost:3000](http://localhost:3000)

The bundled UI is also served by Django on [http://localhost:8000](http://localhost:8000)
The API is served by Django as well.

## React UI
The React UI src is located in `/tapir_mail_ui`.

Run the `bundle.sh` script to build the react app and copy the static files to the django module.
