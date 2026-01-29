FROM python:3.12-slim-bookworm

WORKDIR /app

COPY . .

RUN pip install --no-cache-dir -r requirement.txt -i https://mirrors.aliyun.com/pypi/simple

RUN python init_db.py

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
