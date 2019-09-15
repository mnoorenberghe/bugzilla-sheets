# Bugzilla add-on for Google Sheets
Google Apps Script add-on that fetches data from a Bugzilla installation to populate columns.

Install from https://chrome.google.com/webstore/detail/bugzilla/eapdbacofopbmmbpmcclpnncelfgkefe

Develop using [clasp](https://github.com/google/clasp).

## Development ##

### Publishing a new version ###
1. Open the script editor with `clasp open`.
1. Create a new version in the script editor with File > Manage Versions…
1. Publish new version at https://console.cloud.google.com/apis/api/appsmarket-component.googleapis.com/googleapps_sdk?project=project-id-iyovgkkykvavjwbheov using the new version number from above.
1. In the script editor, Publish > Deploy as add-on… and then choose the updated version and submit for review.
