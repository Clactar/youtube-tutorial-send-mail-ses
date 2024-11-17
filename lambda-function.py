import json
import boto3
from typing import Optional, Union, Dict, List

def lambda_handler(event, context):
    try:
        # Use event directly instead of looking for body
        body = event
        
        # Extract required parameters
        sender = body.get('from')
        recipients = body.get('to')
        subject = body.get('subject')
        html_content = body.get('html')
        text_content = body.get('text')
        
        # Validate required fields
        if not all([sender, recipients, subject]) or (not html_content and not text_content):
            return {
                'statusCode': 400,
                'body': json.dumps({
                    'error': 'Missing required parameters. Please provide: from, to, subject, and either html or text content'
                })
            }
        
        # Convert single recipient to list
        if isinstance(recipients, str):
            recipients = [recipients]
            
        # Initialize SES client
        ses = boto3.client('ses')
        
        # Prepare message structure
        message: Dict = {
            'Subject': {'Data': subject}
        }
        
        # Add content based on what was provided
        body: Dict = {}
        if html_content:
            body['Html'] = {'Data': html_content}
        if text_content:
            body['Text'] = {'Data': text_content}
        message['Body'] = body
        
        # Send email
        response = ses.send_email(
            Source=sender,
            Destination={
                'ToAddresses': recipients
            },
            Message=message
        )
        
        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'Email sent successfully',
                'messageId': response['MessageId']
            })
        }
        
    except Exception as e:
        return {
            'statusCode': 500,
            'body': json.dumps({
                'error': str(e)
            })
        }