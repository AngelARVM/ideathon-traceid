# SubMarket

Marketplace regional (NEA) de subproductos agroindustriales. Lo que sobra, vale.

```bash
cp .env.example .env.local   # completar PERSONA_SECRET: openssl rand -base64 32
make db                      # Postgres en Docker, migraciones y seed de demo
make up                      # app en el primer puerto libre desde 3000
npm run db:seed -- --reset-demo   # reiniciar la demo
```

Contrato del MVP: [`docs/00-mvp-spec.md`](docs/00-mvp-spec.md).
