import { createRxDatabase, addRxPlugin } from 'rxdb';
import { getRxStorageDexie } from 'rxdb/plugins/storage-dexie';
import { RxDBDevModePlugin, disableWarnings } from 'rxdb/plugins/dev-mode';

import { wrappedValidateAjvStorage } from 'rxdb/plugins/validate-ajv';

addRxPlugin(RxDBDevModePlugin);
disableWarnings();

const customerRxSchema = {
  title: 'customer schema',
  version: 0,
  primaryKey: 'id', 
  type: 'object',
  properties: {
    id: { type: 'string', maxLength: 100 }, 
    name: { type: 'string' },
    dob: { type: 'string' },
    address: { type: 'string' },
    aadhar: { type: 'string' },
    aadharimage: { type: 'string' }, 
    recentimage: { type: 'string' },
    email: { type: 'string' },
    phone: { type: 'string' },
    createdBy: { type: 'string' },
    updatedAt: { type: 'number' } ,
    isSynced: { type: 'boolean'},
  },
  required: ['id', 'name', 'phone', 'createdBy', 'isSynced']
};

let dbPromise = null;

export const getDatabase = async () => {
  if (dbPromise) return dbPromise;

  const createDB = async () => {
    const db = await createRxDatabase({
      name: 'pawnshop_offline_db',
      
      storage: wrappedValidateAjvStorage({
        storage: getRxStorageDexie()
      }),
      
      ignoreDuplicate: true
    });

    await db.addCollections({
      customers: {
        schema: customerRxSchema
      }
    });

    return db;
  };

  dbPromise = createDB();
  return dbPromise;
};