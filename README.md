# tapir-mail-module

[![Code style: black](https://img.shields.io/badge/code%20style-black-000000.svg)](https://github.com/psf/black)
[![Code stlye: Prettier](https://img.shields.io/badge/code%20style-prettier-F7B93E?logo=Prettier)](https://prettier.io/)

Mass mailing module for Tapir with MJML mail template editor

## Development

### First setup

After cloning, install automated formatting checks with

```shell
pre-commit install
```

Python code is formatted with [Black](https://github.com/psf/black), Javascript/Typscript/Html/... is formatted
with [Prettier](https://prettier.io/).

### Updating the API

If you do any changes to the models or the API on the Django side, you'll want to update the JavaScript clients to see
the changes on the React side. This is done with

```shell
docker compose exec django bash ./scripts/generate_api_clients.sh
```

## Running the server

### Locally with Docker

After cloning the repo, running `docker compose up` should be enough to get the Django and the React server running.
The Django API is served on [http://localhost:8000](http://localhost:8000), the React UI dev server
on [http://localhost:3000](http://localhost:3000).

The React content is not built automatically to reduce container start time. If you want to test the built version or if
you want to access everything from the Django server, run

```shell
docker compose exec django bash ./scripts/bundle.sh
```

### Locally without docker or during deployment

If you want to run the server without Docker, or if you want to know what you need to install on your production
servers, check the `scripts/install.sh` script.

The Django and React server are started respectively with

```shell
poetry run python manage.py runserver #Django
cd tapir_mail_ui && npm start #React, for development only
```

On a production server, you'll need to run `scripts/bundle.sh` after the files have been copied to your server.
