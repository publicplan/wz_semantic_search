## .env Settings

ELASTIC_USER=  
ELASTIC_PASSWORD=  
ELASTIC_URL=  
EMBEDDING_MODEL="jinaai/jina-embeddings-v3"  
EMBEDDING_URL= 
PORT=3001  


## wz-api INDEX for ElasticSearch

```json
{
  "mappings": {
    "properties": {
      "code": {
        "type": "keyword"
      },
      "name": {
        "type": "text"
      },
      "name_vector": {  
        "type": "dense_vector",
        "dims": 1024
      },
      "division_name": {
        "type": "text"
      },
      "division_name_vector": {  
        "type": "dense_vector",
        "dims": 1024
      },
      "group_name": {
        "type": "text"
      },
      "group_name_vector": {  
        "type": "dense_vector",
        "dims": 1024
      },
      "class_name": {
        "type": "text"
      },
      "class_name_vector": {  
        "type": "dense_vector",
        "dims": 1024
      },
      "explanation": {
        "type": "text"
      },
      "explanation_vector": {  
        "type": "dense_vector",
        "dims": 1024
      },
      "exclusions": {
        "type": "text"
      }
    }
  }
}
```

## install

Pull the git repo and then:  
  
```  
npm i  
```  

## how to run

```
node index.js
```