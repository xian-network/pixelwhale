import { getOwnedUids, getKeys, getThingByUid, getThingForSale } from "./graphqlQueries.js";

export const makeGraphQLRequest = async (query) => {
    const url = "https://testnet.xian.org/graphql";
  
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ query }),
      });
  
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const text = await response.text();
      try {
        return JSON.parse(text);
      } catch (parseError) {
        console.error("Failed to parse JSON response:", text);
        throw new Error(`Invalid JSON response: ${parseError.message}`);
      }
    } catch (error) {
      console.error("There was an error:", error);
      throw error;
    }
};

export const extractUids = (nodes) => {
  const uniqueUids = new Set();
  for (const node of nodes) {
      const { key } = node;
      if (key && key.includes(":") && key.split(":")[1].length === 64) {
          uniqueUids.add(key.split(":")[1]);
      }
  }

  return Array.from(uniqueUids);
}

export const extractThingValues = (uid, queryData) =>{
    const thing = {};

    function getValue(field){
        if (field.nodes.length === 0){
            return ""
        }else{
            return field.nodes[0].value
        }
    }

    thing.uid = uid;
    thing.thing = getValue(queryData.thing);
    thing.created = getValue(queryData.created);
    thing.owner = getValue(queryData.owner);
    thing["price_hold"] = getValue(queryData.price_hold);
    thing["price_amount"] = getValue(queryData.price_amount);
    thing.type = getValue(queryData.type);
    thing.name = getValue(queryData.name);
    thing.description = getValue(queryData.description);
    thing.creator = getValue(queryData.creator);
    thing.likes = getValue(queryData.likes);
    thing["speed"] = getValue(queryData.speed);
    thing["num_of_frames"] = getValue(queryData.frames);
    thing["royalty_percent"] = getValue(queryData.royalty);
    thing.proof = getValue(queryData.proof);
    // thing["names.uid"] =getValue(queryData.S_names);

    return thing; 
}

export async function* processThings(offset, owner="", forsale=false) {
    let query;
    let uidQueryResults;
    let uids;
    
    if (owner){
      query = getOwnedUids(owner, offset);
      uidQueryResults = await makeGraphQLRequest(query);
      uids = extractUids(uidQueryResults?.data.allStates.nodes);
    } else if (forsale){
      query = getThingForSale();
      uidQueryResults = await makeGraphQLRequest(query);
      uids = extractUids(uidQueryResults?.data.allStates.nodes);
    } else {
      query = getKeys(offset);
      uidQueryResults = await makeGraphQLRequest(query);
      uids = extractUids(uidQueryResults?.data.allStateChanges.nodes);
    }

    for (const uid of uids) {
      if (uid){
        await new Promise(resolve => setTimeout(resolve, 1000)); // Add a 1-second delay
        
        const thingQuery = getThingByUid(uid);
        const thingQueryResults = await makeGraphQLRequest(thingQuery);
        const thingData = thingQueryResults?.data

        yield extractThingValues(uid, thingData);
      }
    }
}

export const mockPixelThing = ()=>{
  let things = [];
  const thing = {
    "uid": "c3361632d6a205715dca150fc09c6219c897ec2420d370740e23e6be548088ab",
    "thing": "RRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRTRTRRRRRRRRRRRRRRRRRRRRRTRTRTRRRRRRRRRRRRRRRRRRRRRTRTRTRRRRRRRRRRRRRRRRRRRRRTRTRRRRRRRRRRRRRRRRRRRRRRRTRRRRRRRRRRRRRRRRRRRRRRTRRTRRRRRRRRRRRRRRRRRRRRRTRRTRRRRRRRRRRRRRRRRRRRRRTRRRRRRRRRRRRRRRRRRRRRRRRRTRTRRRRRRRRRRRRRRRRRRRRRRRTRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR",
    "created": "2024-09-23T21:44:35.556472",
    "owner": "5fa1b314468832fb9d391e8af756140e85325a565d8b411ae2f2001d37c30ef4",
    "price.hold": "",
    "price.amount": 0,
    "type": "text/plain",
    "name": "cool_pixel",
    "description": "cool cool pixel",
    "creator": "5fa1b314468832fb9d391e8af756140e85325a565d8b411ae2f2001d37c30ef4",
    "likes": "",
    "meta.speed": 500,
    "meta.num_of_frames": 1,
    "meta.royalty_percent": 5,
    "proof": "",
    "names.uid": ""
  }

  for (let i = 0; i < 25; i++){
    things.push(thing)
  }

  return things;
}