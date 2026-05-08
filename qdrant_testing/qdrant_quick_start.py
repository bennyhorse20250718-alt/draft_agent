# PROXY setting
import os
os.environ['HTTP_PROXY'] = 'http://proxy.fhb.hksarg:8080'
os.environ['HTTPS_PROXY'] = 'http://proxy.fhb.hksarg:8080'
os.environ['NO_PROXY'] = 'http://10.75.118.127:1234'

from qdrant_client import QdrantClient

qdrant_client = QdrantClient(
    url="https://be2a16a6-836c-4fc1-a6bd-93073c40db91.sa-east-1-0.aws.cloud.qdrant.io:6333", 
    api_key="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhY2Nlc3MiOiJtIiwic3ViamVjdCI6ImFwaS1rZXk6NjAyZjZmY2MtN2RiMS00ODQ1LWJmZDYtNWIxNjdkZmM5OWJlIn0.0b8oBgoJl2MGQyrH2CdLmA1veQX2KKHTFc1_DY2ZHnc",
    cloud_inference=True
)

print(qdrant_client.get_collections())