import {DynamoDB} from 'aws-sdk'
import {v4} from 'uuid'

const dynamoDB = new DynamoDB.DocumentClient()

const storeState = async (state: string) => {
    const id = v4()

    await dynamoDB
        .put({
            TableName: process.env.DYNAMODB_TABLE_STATE!,
            Item: {
                id,
                state,
            },
        })
        .promise()

    return {id}
}

export const handler = async (event: any) => {
    try {
        const body = await storeState(event.body)

        return {
            statusCode: 200,
            body: JSON.stringify(body),
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
            },
        }
    } catch (error) {
        if (error.message === 'Not found') {
            return {
                statusCode: 404,
                body: error.message,
            }
        }

        console.error(error)

        return {
            statusCode: 500,
            body: 'Internal Server Error',
            headers: {
                'Access-Control-Allow-Origin': '*',
            },
        }
    }
}
