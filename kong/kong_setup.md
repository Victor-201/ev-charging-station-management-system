# Hướng dẫn chạy Kong với Docker Compose

## Bước 1: Tạo network nếu chưa có

```bash
docker network create kong-net
```

## Bước 2: Chạy database

```bash
docker compose up -d kong-database
```

## Bước 3: Chạy migration 1 lần và tự xóa container

```bash
docker compose run --rm kong-migrations
```

## Bước 4: Chạy Kong

```bash
docker compose up -d kong
```

## Bước 5: Thêm các container khác vào trong kong-net nếu cần

```bash
docker network connect kong-net <container_name>
```

## Bước 6: Tạo service và route trong kong để có thể gọi tới api

```bash

## Tạo service trong kong
curl -i -X POST http://localhost:8001/services \
  --data name=<service-name> \
  --data url='http://<your-container-name>:<Port>'

## Tạo route kết nối tới service
curl -i -X POST http://localhost:8001/routes \
  --data name=<route-name> \
  --data service.name=<service-name> \
  --data hosts[]=<container-name> \
  --data paths[]=/api/v1/<your-router> \
  --data strip_path=false

```
## Các câu lệnh cần thiết để thao tác với kong và network

```bash
### Xem danh sách net-work
docker network ls

### Xem trạng thái của network cụ thể
docker network inspect <name-network>

### Xuất cấu hình của kong ra yml bằng deck
deck gateway dump --kong-addr http://localhost:8001 -o kong.yaml

### Nạp file cấu hình kong.yml vào kong container
deck sync --state kong.yaml --kong-addr http://localhost:8001

```
## Setup deck ##

```bash

curl -Lo deck.tar.gz https://github.com/Kong/deck/releases/download/v1.31.1/deck_1.31.1_linux_amd64.tar.gz

tar -xzf deck.tar.gz
sudo mv deck /usr/local/bin/

deck version

### Dùng deck để export cấu hình
deck gateway dump --kong-addr http://localhost:8001 -o kong.yml

### Dùng deck để import ghì đè cấu hình
deck gateway sync --kong-addr http://localhost:8001 -s kong.yml

```

> Lưu ý: File này chỉ mang tính chất hướng dẫn. Copy nội dung vào máy và thực hiện từng bước. Không cần chạy toàn bộ tự động.