import axios from 'axios'
import {DynamoDB} from 'aws-sdk'

const dynamoDB = new DynamoDB.DocumentClient()

function getRandomInt(min: number, max: number) {
    min = Math.ceil(min)
    max = Math.floor(max)
    return Math.floor(Math.random() * (max - min + 1)) + min
}

const getImageUrl = async (seed: string) => {
    const cachedImage = await dynamoDB
        .get({
            TableName: process.env.DYNAMODB_TABLE_IMAGES!,
            Key: {id: seed},
        })
        .promise()

    if (cachedImage.Item) return cachedImage.Item.location

    const picsumRes = await axios.get(`https://picsum.photos/${getRandomInt(200, 600)}/${getRandomInt(200, 600)}`, {
        maxRedirects: 0,
        validateStatus: (status) => status === 302,
    })

    const location = picsumRes.headers.location

    await dynamoDB
        .put({
            TableName: process.env.DYNAMODB_TABLE_IMAGES!,
            Item: {
                id: seed,
                location: location,
            },
        })
        .promise()

    return location
}

export const handler = async (event: any) => {
    try {
        const location = await getImageUrl(event.queryStringParameters.seed)

        return {
            statusCode: 302,
            body: '',
            headers: {location},
        }
    } catch (error) {
        console.error(error)

        return {
            statusCode: 500,
            body: 'Internal Server Error',
        }
    }
}
