import json
import responses

from django.contrib.auth.models import User
from django.core.urlresolvers import reverse
from rest_framework.test import APIClient

def test_create_bug(webapp, eleven_jobs_stored, mock_message_broker, jm):
    """
    test creating a bug in bugzilla
    """
    client = APIClient()
    user = User.objects.create(username="MyName", email="foo@bar.com")
    client.force_authenticate(user=user)
    
    job = jm.get_job_list(0, 1)[0]
    resp = client.post(
        reverse("bugzilla-list"),
        {
            "product": "Bugzilla",
            "component": "Administration",
            "summary": "Intermittent summary",
            "version": "4.0.17",
            "description": "Intermittent Description",
            "comment_tags": "treeherder",
            "keywords": "intermittent-failure"
        }
    )

    user.delete()

    content = json.loads(resp.content)
    print content
    
    jm.disconnect()
