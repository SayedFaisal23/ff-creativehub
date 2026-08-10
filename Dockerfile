FROM php:8.4-cli

RUN apt-get update \
    && apt-get install -y --no-install-recommends git unzip libzip-dev ffmpeg \
    && docker-php-ext-install pdo_mysql zip \
    && rm -rf /var/lib/apt/lists/*

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

RUN printf "upload_max_filesize=64M\npost_max_size=72M\nmemory_limit=512M\nmax_execution_time=300\n" > /usr/local/etc/php/conf.d/creative-monitor.ini

WORKDIR /var/www/html

CMD sh -c "if [ ! -f vendor/autoload.php ]; then composer install; fi && if [ ! -f .env ]; then cp .env.example .env; fi && if ! grep -q '^APP_KEY=base64:' .env; then php artisan key:generate --force; fi && php artisan migrate --force && php artisan serve --host=0.0.0.0 --port=8000"
