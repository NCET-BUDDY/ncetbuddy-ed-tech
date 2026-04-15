/// <reference path="../pb_data/types.d.ts" />
migrate((db) => {
  const collection = new Collection({
    "id": "kz04eyloy4lafvw",
    "created": "2026-04-14 21:19:20.752Z",
    "updated": "2026-04-14 21:19:20.752Z",
    "name": "user_profiles",
    "type": "base",
    "system": false,
    "schema": [
      {
        "system": false,
        "id": "x84ttxuc",
        "name": "userId",
        "type": "text",
        "required": true,
        "presentable": false,
        "unique": false,
        "options": {
          "min": null,
          "max": null,
          "pattern": ""
        }
      },
      {
        "system": false,
        "id": "7vue789l",
        "name": "email",
        "type": "email",
        "required": false,
        "presentable": false,
        "unique": false,
        "options": {
          "exceptDomains": null,
          "onlyDomains": null
        }
      },
      {
        "system": false,
        "id": "mjj9h9xc",
        "name": "displayName",
        "type": "text",
        "required": false,
        "presentable": false,
        "unique": false,
        "options": {
          "min": null,
          "max": null,
          "pattern": ""
        }
      },
      {
        "system": false,
        "id": "yooopwfl",
        "name": "role",
        "type": "select",
        "required": true,
        "presentable": false,
        "unique": false,
        "options": {
          "maxSelect": 1,
          "values": [
            "user",
            "admin",
            "educator"
          ]
        }
      },
      {
        "system": false,
        "id": "2sepl9oz",
        "name": "premiumStatus",
        "type": "bool",
        "required": false,
        "presentable": false,
        "unique": false,
        "options": {}
      }
    ],
    "indexes": [],
    "listRule": "",
    "viewRule": "",
    "createRule": null,
    "updateRule": null,
    "deleteRule": null,
    "options": {}
  });

  return Dao(db).saveCollection(collection);
}, (db) => {
  const dao = new Dao(db);
  const collection = dao.findCollectionByNameOrId("kz04eyloy4lafvw");

  return dao.deleteCollection(collection);
})
