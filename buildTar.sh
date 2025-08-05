VERSION="v$(jq .version -r driver.json)"
FILE_NAME="dist/integration-dreambox-${VERSION}.tar.gz"

npm run build
rm -r ./dist/tar
rm ./dist/*.tar.gz
mkdir ./dist/tar
cp driver.json ./dist/tar/
echo $VERSION > ./dist/tar/version.txt
cp -r ./dist/src ./dist/tar/bin
cp package.json ./dist/tar/bin/
npm install --omit=dev --prefix ./dist/tar/bin
rm ./dist/tar/bin/package.json
rm ./dist/tar/bin/package-lock.json
tar -C ./dist/tar -czvf ${FILE_NAME} ./