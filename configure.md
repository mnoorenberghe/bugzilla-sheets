# Bugzilla add-on: how to configure a gsheet with the Bugzilla Addon


## Bugzilla Add-on Configurations ## 
1. Add-ons/Bugzilla/Setup/ Set # of header rows to ignore: default value 1 (set 3 for example if the header is a 3 lines one)
1. Add-ons/Bugzilla/Setup/Set watch Column: default value 1  Point to the column that will contain Bugzilla Bug ids:  
1. Understanding Bugzilla columns. Note here that the bugid column will be defaulted will not have to be specified and the next will follow in order and that there are several types of columns you need to be aware of:
    1. Static fields: (e.g. status, assigned_to, creation_time, last_change_date, etc) - the complete list of static fields can be found in here: http://bugzilla.readthedocs.io/en/latest/api/core/v1/bug.html
    1. Custom fields: (e.g. the name of the field will start with cf - e.g. cf_backlog, cf_has_regression_range, cf_has_str, etc.) the list can be found at https://gist.github.com/dylanwh/9b0d4c02024b4247d9f4209e258bea26 
1. Adding an Edit trigger: Add-ons/Bugzilla/Setup/Activate Edit trigger (now the line is updated as you finish typing the bug number and focus away)

Video Help here: [Configuring Bugzilla Addon](https://www.youtube.com/watch?v=in05jed4uVA&t=0s)

### To be considered  ###
1. The Bugzilla Add-on applies the same configuration per gsheet document and NOT per sheet. (if different columns are required per sheet, you might want to consider different documents)
1. The Bugzilla Add-on updates visible and hidden columns alike.
1. Addons/Bugzilla/Update Active Sheet might time-out for a very long list of bugid's (workaround - consider using Addons/Bugzilla/Update Selection with a reduced number of bugid's)

Video Help here: [Best practices, Known issues](https://www.youtube.com/watch?v=in05jed4uVA&t=250s)

 
### Example  ###
1. https://docs.google.com/spreadsheets/d/13hU8NYhRDNRaSY9BCqiTuohlMFS3T_eiG-H6wqksFks/edit#gid=0
    1. Columns set: summary, status, product, component, platform, resolution, cf_status_firefox86, cf_status_firefox85,cf_status_firefox84
        1. Edit Trigger - active
        1. Number of rows to ignore: 1 (default)
        1. Set watch column: 1 (default) - identifies the gsheet column on which the bugid will be found
        
    
        






