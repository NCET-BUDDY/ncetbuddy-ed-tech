FROM alpine:latest

ARG PB_VERSION=0.22.8

RUN apk add --no-cache \
    unzip \
    ca-certificates

# Download PocketBase
ADD https://github.com/pocketbase/pocketbase/releases/download/v${PB_VERSION}/pocketbase_${PB_VERSION}_linux_amd64.zip /tmp/pb.zip
RUN unzip /tmp/pb.zip -d /pb/ && \
    chmod +x /pb/pocketbase && \
    rm /tmp/pb.zip

# Copy seed data (will be used only on first run)
COPY pb_data /pb/pb_data_seed
COPY pb_migrations /pb/pb_migrations

EXPOSE 8090

# Use the persistent volume at /pb/pb_data
# On first boot, if no data.db exists, copy seed data in
CMD sh -c '\
    mkdir -p /pb/pb_data && \
    if [ ! -f /pb/pb_data/data.db ]; then \
        echo "First run: seeding database from migration data..." && \
        cp -R /pb/pb_data_seed/* /pb/pb_data/ 2>/dev/null || true; \
    else \
        echo "Existing database found, skipping seed."; \
    fi && \
    /pb/pocketbase serve --http=0.0.0.0:8090 --dir=/pb/pb_data --migrationsDir=/pb/pb_migrations'
