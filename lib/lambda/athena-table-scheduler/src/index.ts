import { AthenaClient, StartQueryExecutionCommand } from '@aws-sdk/client-athena';
import { ScheduledEvent } from 'aws-lambda';

const athenaCatalogName = process.env.ATHENA_CATALOG_NAME
const athenaDatabaseName = process.env.ATHENA_DATABASE_NAME;
const queryResultsLocation = process.env.ATHENA_QUERY_RESULTS_LOCATION;
const athenaTableName = process.env.ATHENA_TABLE_NAME;

const AWS_REGION: string = process.env.AWS_REGION || 'eu-central-1';
const athenaClient = new AthenaClient({ region: AWS_REGION });

export const mainHandler = async (event: ScheduledEvent) => {

  let queryCommand = new StartQueryExecutionCommand({
    QueryExecutionContext: {
      Catalog: athenaCatalogName,
      Database: athenaDatabaseName,
    },
    ResultConfiguration: {
      OutputLocation: queryResultsLocation,
    },
    QueryString: `MSCK REPAIR TABLE ${athenaTableName};`
  });

  await athenaClient.send(queryCommand);
  
};

export const handler = mainHandler;
