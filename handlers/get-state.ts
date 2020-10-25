import {DynamoDB} from 'aws-sdk'
import {v4} from 'uuid'

const dynamoDB = new DynamoDB.DocumentClient()

const getState = async (id: string) => {
    const state = await dynamoDB
        .get({
            TableName: process.env.DYNAMODB_TABLE_STATE!,
            Key: {id},
        })
        .promise()

    if (!state.Item) {
        throw new Error('Not found')
    }

    return state.Item.state
}

export const handler = async (event: any) => {
    try {
        const id = event.queryStringParameters.id
        if (!id) throw new Error('Not found')

        const body = await getState(id)

        return {
            statusCode: 200,
            body,
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
