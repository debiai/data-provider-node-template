# DebiAI data-provider NodeJs template

<p align="center">
A web REST API service template exposing some data to be used by DebiAI.
</p>

<p align="center">
<a href="https://debiai.irt-systemx.fr/dataInsertion/dataProviders">More info on DebiAI data-providers</a>
</p>

## Requirements

* NodeJS (version: `16.13.0`)

## Setup
```bash
git clone https://github.com/debiai/data-provider-nodejs-template

mv data-provider-nodejs-template my-data-provider

cd my-data-provider

npm i
```

## Serve
```bash
npm run serve
```

## Test
```bash
npm run test
```


## Production

Build :
```bash
docker build -f Dockerfile -t debiai-data-provider .
```
Run :
```bash
docker run -it -d -p 3010:3010 debiai-data-provider
```