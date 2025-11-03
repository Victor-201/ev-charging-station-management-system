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
  --data url='http://<your-container-name>:<Port>/api/v1'

## Tạo route kết nối tới service
curl -i -X POST http://localhost:8001/routes \
  --data name=<route-name> \
  --data service.name=<service-name> \
  --data hosts[]=<container-name> \
  --data paths[]=/api/v1 \
  --data strip_path=false


> Lưu ý: File này chỉ mang tính chất hướng dẫn. Copy nội dung vào máy và thực hiện từng bước. Không cần chạy toàn bộ tự động.