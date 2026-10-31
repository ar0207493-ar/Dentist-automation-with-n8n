FROM docker.io/evoapicloud/evolution-api@sha256:456b4104b0ddffbb092d6b3c0560a4ae86fc3e014e885b882aca4b1b371dfc81
WORKDIR /evolution
COPY start.sh /evolution/dentora/start.sh
COPY prepare-db.cjs /evolution/dentora/prepare-db.cjs
COPY patch-manager.cjs phone-pairing.js /evolution/dentora/
RUN node /evolution/dentora/patch-manager.cjs
ENV TZ=Asia/Karachi
EXPOSE 10000
ENTRYPOINT ["/bin/sh", "/evolution/dentora/start.sh"]
