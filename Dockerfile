FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY services ./services
COPY schemas ./schemas

EXPOSE 8000
EXPOSE 8001

CMD ["uvicorn"]
