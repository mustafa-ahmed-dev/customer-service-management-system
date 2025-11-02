# Database Design

## Database design

### Departments

1. id

2. name

3. manager id

### Users

1. id

2. name

3. email

4. password

5. role (admin, manager, user)

### Activity type

1. id

2. type (login, logout, break, meeting)

### Activities

1. id

2. employee

3. date

4. time

5. type id

### Social Media Performance

1. id

2. employee id

3. date

4. number of conversations

5. average conversation pickup time

6. average conversation first response time

7. average conversation response time

8. number of tickets

9. number of live chat messages

10. number of comments

### Social Media Conversation Statuses

1. date

2. status (attended, unassigned)

3. number of conversations

### Social Media Channels

1. date

2. channel id

3. number of conversations

### Social Media Contacts

1. date

2. contact type (new, existing)

3. number of contacts

___

## Reports

It should be filtered by the date or date range

### Social Media Attended Conversations Report

* Table

  1. employee

  2. number of conversations

* Chart

  * Pie chart containing the data in the table

### Social Media Channel Conversations Report

* Table

  1. channel name

  2. number of conversations

* Chart

  * Pie chart containing the data in the table

### Social Media Conversation Attendance Report

* Table

  1. conversation status

  2. number of conversations

* Chart

  * Pie chart containing the data in the table if it is daily

  * Column chart containing the data in the table if it is not daily

### Social Media Conversation Speed Report

* Table

  1. employee

  2. average pickup time

  3. average first response time

  4. average response time

* Chart

  * Column chart containing the data in the table

### Social Media Contacts Report

* Table

  1. contact type

  2. number of contacts

* Chart

  * Pie chart containing the data in the table

### Social Media Attended conversations

This report is mostly weekly or monthly

* Table

  1. date

  2. number of conversations

* Chart

  * Line chart containing the data in the table
