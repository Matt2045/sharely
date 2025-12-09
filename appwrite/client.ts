import {Client, Account, Databases, Storage} from 'appwrite';

export const appwriteConfig = {

    endpointUrl: import.meta.env.VITE_APPWRITE_ENDPOINT_API,
    projectId: import.meta.env.VITE_APPWRITE_PROJECT_ID,
    databaseId: import.meta.env.VITE_APPWRITE_PINTEREST_DATABASE_ID,
    userCollectionId: import.meta.env.VITE_APPWRITE_USERS_COLLECTION,
    pinCollectionId: import.meta.env.VITE_APPWRITE_PINS_COLLECTION,
    savedPinsCollectionId: import.meta.env.VITE_APPWRITE_SAVED_PINS_COLLECTION,
    likedPinsCollectionId: import.meta.env.VITE_APPWRITE_LIKED_PINS_COLLECTION,
    storageBucketId: import.meta.env.VITE_APPWRITE_STORAGE_BUCKET_ID,
    unsplashAccessKey: import.meta.env.VITE_UNSPLASH_API_ACCESS_KEY,


}

const client = new Client();

client
    .setEndpoint(appwriteConfig.endpointUrl)
    .setProject(appwriteConfig.projectId);

const account = new Account(client);
const database = new Databases(client);
const storage = new Storage(client);


export {client, account, storage, database};
export { ID } from 'appwrite';
