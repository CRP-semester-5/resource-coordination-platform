FROM kong:3.7-ubuntu

# Set Kong to DB-less mode
ENV KONG_DATABASE="off"
ENV KONG_DECLARATIVE_CONFIG="/kong/kong.yml"
ENV KONG_PROXY_LISTEN="0.0.0.0:3000"
ENV KONG_ADMIN_LISTEN="0.0.0.0:8001"
ENV KONG_LOG_LEVEL="notice"
ENV KONG_PLUGINS="bundled"

# Copy the declarative config into the container
USER root
RUN mkdir -p /kong && chown kong:kong /kong
USER kong

COPY --chown=kong:kong api-gateway/kong/kong.yml /kong/kong.yml

EXPOSE 3000
EXPOSE 8001

# The default entrypoint for the Kong image will handle starting it
