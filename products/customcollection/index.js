/* eslint-disable max-len */
// const sanitizer = require("./sanitizer");
const functions = require("firebase-functions");
const fetch = require("node-fetch");
const admin = require("firebase-admin");
admin.initializeApp(functions.config().firebase);
// const firestore = require("firebase-firestore");
// Create and Deploy Your First Cloud Functions
// https://firebase.google.com/docs/functions/write-firebase-functions
exports.backupCustomCollection = functions.https.onCall((data) => {
  console.log("data4", data);
  const ShopifyId = data.tenant.ShopifyId;
  console.log("shopify3", ShopifyId);
  const ShopifyToken = data.tenant.ShopifyToken;
  const url = `https://${ShopifyId}.myshopify.com/admin/api/2022-10/custom_collections.json`;
  console.log("urls", url);
  console.log("token", ShopifyToken);
  fetch(url, {
    headers: {
      "Content-Type": "application/json",
      // eslint-disable-next-line camelcase, no-undef
      "X-Shopify-Access-Token": ShopifyToken,
    },
  }).then(function(response) {
    const jsonObject = response.json();
    console.log("response", jsonObject);
    return jsonObject;
  }).then(function(data) {
    // console.log("type", typeof data.products);
    console.log("fetch datas", data);
    const db = admin.firestore();
    // console.log("db", db);
    const batch=db.batch();
    const todayDate = new Date().toISOString().slice(0, 16);
    console.log("daata date", todayDate);
    data.custom_collections.forEach((doc)=>{
      // console.log("doc ref", doc.created_at);
      const docRef = db.collection(ShopifyId).doc("data").collection("CustomCollections").doc(todayDate).collection("data").doc();
      batch.set(docRef, doc);
    });
    const Backups={
      "Date": todayDate,
      "Object": "CustomCollections",
      "No Of Records": data.custom_collections.length,
    };
    const BackupDocref=db.collection(ShopifyId).doc("data").collection("Backups").doc();
    batch.set(BackupDocref, Backups);
    batch.commit();
  });
});
exports.restoreCustomCollection = functions.https.onCall((data) => {
  console.log("data4", data);
  const ShopifyId = data.tenant.ShopifyId;
  console.log("shopify3", ShopifyId);
  console.log("data", data.todayDate);
  const ShopifyToken = data.tenant.ShopifyToken;
  // Get all the documents from the Firestore collection called
  const todayDate = new Date().toISOString().slice(0, 2);
  console.log("daata date", todayDate);
  admin.firestore().collection(ShopifyId).doc("data").collection("CustomCollections").doc(data.todayDate).collection("data").limit(1).get().then((docs) => {
    // Get all the data from each documents
    docs.forEach((doc) => {
      const product = doc.data();
      console.log("product", product);
      const id = product.id;
      console.log(id, "id");
      console.log("doc id", doc.id );
      fetch(`https://${ShopifyId}.myshopify.com/admin/api/2022-10/custom_collections/`+id+".json", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          // eslint-disable-next-line camelcase, no-undef
          "X-Shopify-Access-Token": ShopifyToken,
        },
      }).then(function(response) {
        const jsonObject = response.json();
        return jsonObject;
      }).then(function(data) {
        console.log("data loading", data);
        const json = JSON.stringify({custom_collection: product});
        // console.log("json", json);
        if (data.custom_collection) {
          // console.log("type", typeof data.product);
          // console.log("data fetching", data.product.id);
          // console.log("json", JSON.stringify(data.product, null, 4));
          fetch(`https://${ShopifyId}.myshopify.com/admin/api/2022-10/custom_collections/`+data.custom_collection.id+".json", {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              // eslint-disable-next-line camelcase, no-undef
              "X-Shopify-Access-Token": ShopifyToken,
            },
            body: json,
          }).then(function(response) {
            const jsonObject = response.json();
            return jsonObject;
          }).then(function(val) {
            console.log("Updated a Datas", val);
          });
        } else {
          fetch(`https://${ShopifyId}.myshopify.com/admin/api/2022-10/custom_collections.json`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              // eslint-disable-next-line camelcase, no-undef
              "X-Shopify-Access-Token": ShopifyToken,
            },
            body: json,
          }).then(function(response) {
            const jsonObject = response.json();
            return jsonObject;
          }).then(function(val) {
            // console.log("Created a Datas", val);
          });
        }
      });
    });
  });
});
