# Estágio de Build: Para compilar o TypeScript
FROM node:22-slim AS build

WORKDIR /app

# Copia package.json e package-lock.json para o WORKDIR
COPY package*.json ./

# Instala TODAS as dependências, incluindo devDependencies, para o build do TypeScript
# O --force é um último recurso para garantir que tudo seja instalado sem erros
RUN npm install --force

# Copia o restante do código-fonte para o contêiner
COPY . .

# Compila o código TypeScript para JavaScript
RUN npm run build

# Estágio de Produção: Imagem final menor para execução
FROM node:22-slim AS production

WORKDIR /app

# Copia apenas os arquivos compilados (JavaScript) do estágio de build
COPY --from=build /app/dist ./dist
# Copia package.json e package-lock.json novamente para instalar apenas dependências de produção
COPY package*.json ./
# Instala APENAS as dependências de produção para reduzir o tamanho da imagem final
RUN npm install --omit=dev

# Expõe a porta que sua aplicação Node.js vai ouvir (a mesma que você usa no app.listen)
EXPOSE 3000

# Define o comando para iniciar a aplicação
# Garanta que seu script 'start' no package.json aponta para 'node dist/server.js'
CMD [ "npm", "start" ]