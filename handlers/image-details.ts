import axios from 'axios'
import {DynamoDB} from 'aws-sdk'
import * as retry from 'async-retry'

const dynamoDB = new DynamoDB.DocumentClient()

const getImageData = async (seed: string) => {
    const cachedImage = await retry(
        async () => {
            const cachedImage = await dynamoDB
                .get({
                    TableName: process.env.DYNAMODB_TABLE_IMAGES!,
                    Key: {id: seed},
                })
                .promise()

            if (!cachedImage.Item) {
                throw new Error('Not found')
            }

            return cachedImage.Item
        },
        {retries: 3},
    )

    const location = cachedImage.location
    const id = location.split('id/')[1].split('/')[0]

    const {data} = await axios.get(`https://picsum.photos/id/${id}/info`)
    return data
}

export const handler = async (event: any) => {
    try {
        const body = await getImageData(event.queryStringParameters.seed)

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
