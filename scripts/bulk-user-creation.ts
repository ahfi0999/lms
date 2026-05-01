// @ts-nocheck
// TODO: This file is not being used, WIP.
import * as fs from 'fs';
import csv from 'csv-parser';
import path from 'path';
import { authzManagementClient } from '../common/authz-client';

interface User {
  name: string;
  phone?: string;
  email: string;
}

const createUser = async (user: User) => {
  const { name, email } = user;
  try {
    const { user_id } = await authzManagementClient.createUser({
      name,
      // phone_number: phone,
      email,
      email_verified: true,
      connection: 'Username-Password-Authentication',
      password: 'welcome',
    });
    return user_id;
  } catch (error) {
    console.log("ERROR: can't add user ", { name, email });
    console.error(error);
  }
};

const getPhone = (phone?: string) => {
  // Auth0 phone number format ^\\\\+[0-9]{1,15}$, return null if not valid
  if (phone && phone.match(/^\+[0-9]{1,15}$/)) {
    return phone;
  }
};

// Create bulk users in auth0 from csv file
async function main() {
  // Replace this with the path to your CSV file
  const filePath = path.join(__dirname, 'users.csv');

  fs.createReadStream(filePath)
    .pipe(csv())
    .on('data', (row: User) => {
      // Handle each row of data
      createUser({ ...row, phone: getPhone(row.phone) }).then((userId) => {
        console.log(`User created with id: ${userId}`);
      });
    })
    .on('end', () => {
      // Handle end of file
      console.log('CSV file successfully parsed');
    });

  // deleteAllUsers();
}

// const deleteAllUsers = async () => {
//   const users = await authzManagementClient.getUsers();
//   users.forEach((user) => {
//     authzManagementClient.deleteUser({ id: user.user_id as string });
//   });
// };

main().catch((error) => console.error(error));
