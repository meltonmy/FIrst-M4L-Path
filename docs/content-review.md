# Content review

Reviewed 2026-10-22. Original lesson prose and questions; no exam material.

## Official sources consulted successfully

The environment's network policy blocked direct vendor documentation sites. Their official GitHub sources were available without bypassing TLS verification:

- Docker, **What is a container?**: https://github.com/docker/docs/blob/main/content/get-started/docker-concepts/the-basics/what-is-a-container.md — isolated processes, shared kernel versus VMs.
- Docker, **Publishing and exposing ports**: https://github.com/docker/docs/blob/main/content/get-started/docker-concepts/running-containers/publishing-ports.md — `HOST_PORT:CONTAINER_PORT`, default exposure and localhost binding caveat.
- Canonical, **Configuring networks**: https://github.com/canonical/ubuntu-server-documentation/blob/505feb597ec634d49a50edd2cc942be92d2d575b/docs/explanation/networking/configuring-networks.md — `ip addr`, routes, gateway, `/etc/hosts`, differences between transient and persistent configuration. Real interface names vary.
- Canonical, **About Netplan**: https://github.com/canonical/ubuntu-server-documentation/blob/505feb597ec634d49a50edd2cc942be92d2d575b/docs/explanation/networking/about-netplan.md — Netplan with NetworkManager/systemd-networkd renderers.
- iproute2 upstream: https://github.com/iproute2/iproute2/blob/main/man/man8/ip-address.8.in and https://github.com/iproute2/iproute2/blob/main/man/man8/ip-route.8.in — read-only address and route inspection syntax.

Lesson references point to readable official sites, available on the learner's own Internet connection. The app itself requires no reference fetches to work offline.

## Outstanding verification limits

The direct Red Hat documentation site was blocked by the runtime proxy (403). The explanatory comparison mentioning RHEL 9 and NetworkManager has not been live-verified against that release's official manual in this environment. It is not a configuration lab and includes no network-changing commands. Check the linked RHEL release guide before adding actionable RHEL instructions.

Kubernetes and Helm appear only as later roadmap modules, so no version-sensitive commands or working lessons are claimed. Before writing those lessons, verify against https://kubernetes.io/docs/ and https://helm.sh/docs/. Before expanding RHEL guidance, verify against https://docs.redhat.com/.

The saved environment settings draft requests those documentation domains for future verification. Saving the draft does not change the current proxy policy. No public deployment was performed.
