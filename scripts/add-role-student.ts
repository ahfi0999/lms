// @ts-nocheck
// TODO: This file is not being used, WIP.
import { authzManagementClient } from '../common/authz-client';

const ids = [
  'auth0|6390a82a894d42544f733a1c',
  'auth0|6390a82aff5b95c2cfc59dd5',
  'auth0|6390a82a559c37e94a42493b',
  'auth0|6390a82a559c37e94a42493c',
  'auth0|6390a82afc40b32cb5543187',
  'auth0|6390a82a27c5c66ca6ea914c',
  'auth0|6390a82aff5b95c2cfc59dd6',
  'auth0|6390a82a894d42544f733a1d',
  'auth0|6390a82afc40b32cb5543188',
  'auth0|6390a82a559c37e94a42493d',
  'auth0|6390a82a559c37e94a42493e',
  'auth0|6390a82a27c5c66ca6ea914d',
  'auth0|6390a82aa6f0e496f9ee5104',
  'auth0|6390a82a894d42544f733a1e',
  'auth0|6390a82a27c5c66ca6ea914e',
  'auth0|6390a82bfc40b32cb5543189',
  'auth0|6390a82bff5b95c2cfc59dd7',
  'auth0|6390a82b27c5c66ca6ea914f',
  'auth0|6390a82bff5b95c2cfc59dd8',
  'auth0|6390a82bfc40b32cb554318a',
  'auth0|6390a82b27c5c66ca6ea9150',
  'auth0|6390a82b559c37e94a42493f',
  'auth0|6390a82b27c5c66ca6ea9151',
  'auth0|6390a82b894d42544f733a1f',
  'auth0|6390a82ba6f0e496f9ee5106',
  'auth0|6390a82bfc40b32cb554318b',
  'auth0|6390a82b559c37e94a424940',
  'auth0|6390a82b27c5c66ca6ea9152',
  'auth0|6390a82b559c37e94a424941',
  'auth0|6390a82bfc40b32cb554318c',
  'auth0|6390a82bff5b95c2cfc59dd9',
  'auth0|6390a82bff5b95c2cfc59dda',
  'auth0|6390a82b559c37e94a424942',
  'auth0|6390a82b27c5c66ca6ea9154',
  'auth0|6390a82b27c5c66ca6ea9153',
  'auth0|6390a82bff5b95c2cfc59ddb',
  'auth0|6390a82b559c37e94a424943',
  'auth0|6390a82b27c5c66ca6ea9155',
  'auth0|6390a82b559c37e94a424944',
  'auth0|6390a82b27c5c66ca6ea9156',
  'auth0|6390a82bff5b95c2cfc59ddc',
  'auth0|6390a82bff5b95c2cfc59ddd',
  'auth0|6390a82bfc40b32cb554318d',
  'auth0|6390a82c559c37e94a424945',
  'auth0|6390a82c27c5c66ca6ea9157',
  'auth0|6390a82cfc40b32cb554318e',
  'auth0|6390a82c559c37e94a424946',
  'auth0|6390a82cff5b95c2cfc59dde',
];

// Add student role to each auth0 user
async function main() {
  ids.forEach((id) => {
    authzManagementClient.assignRolestoUser(
      {
        id,
      },
      {
        roles: ['rol_tb1oqKNHPsD6CcFf'],
      }
    );
  });
}

main().catch((error) => console.error(error));
