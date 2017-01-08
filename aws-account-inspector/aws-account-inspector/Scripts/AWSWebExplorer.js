function createTable() {
    var r;
    var regionName;
    var regionCode;
    for (r = 0; r < regions.length; r++) {
        regionName = regions[r][0];
        regionCode = regions[r][1];
        var row = table.insertRow(-1);
        var cell1 = row.insertCell(0);
        cell1.id = regionCode + "_name";
        cell1.innerHTML = regionName;
        for (var i = 0; i < services.length; i++) {
            var cell = row.insertCell(i + 1);
            cell.id = regionCode + "_" + services[i];
            cell.innerHTML = "";
            cell.style.textAlign = "center";
        }
    }
}

function list() {
    var bars = document.getElementsByClassName("progress-bar");
    bars[0].style.width = "0%";
    //new_listec2();
    AWS.config.credentials = new AWS.Credentials();
    AWS.config.credentials.accessKeyId = AccessKey.value;
    AWS.config.credentials.secretAccessKey = SecretKey.value;

    for (reg = 0; reg < regions.length; reg++) {
        region = regions[reg][1];
        ec2 = new AWS.EC2();
        elb = new AWS.ELB();
        rds = new AWS.RDS();
        AWS.config.region = region;
        ec2request = ec2.describeInstances(params = {});
        ec2request.on('success', function (request) {
            //console.log(request);
            var data = request.data;
            var region = request.request.service.config.region;
            describeEc2(data, region)
        });
        ec2request.send();

        ebsrequest = ec2.describeVolumes(params = {});
        ebsrequest.on('success', function (request) {
            console.log(request);
            var data = request.data;
            var region = request.request.service.config.region;
            describeEbs(data, region)
        });
        ebsrequest.send();

        eiprequest = ec2.describeAddresses(params = {});
        eiprequest.on('success', function (request) {
            console.log(request);
            var data = request.data;
            var region = request.request.service.config.region;
            describeEip(data, region)
        });
        eiprequest.send();
    }
    for (reg = 0; reg < regions.length; reg++) {
        region = regions[reg][1];
        //_describerds(AccessKey.value, SecretKey.value, region);
        _describeItem(AccessKey.value, SecretKey.value, region, 'RDS');
        _describeItem(AccessKey.value, SecretKey.value, region, 'ELB');
        _describeItem(AccessKey.value, SecretKey.value, region, 'S3');
        _describeItem(AccessKey.value, SecretKey.value, region, 'DDB');
    }

}

function _describeItem(accesskey, secretkey, region, service) {
    AWS.config.region = 'us-east-1'; // Region
    AWS.config.credentials = new AWS.CognitoIdentityCredentials({
        IdentityPoolId: 'us-east-1:c026c80c-33f3-4843-b2b3-8c37da6d452e',
    });
    var lambdaEvent = '{'
           + '"accesskey": "' + accesskey
           + '", "secretkey": "' + secretkey
           + '", "region": "' + region
           + '", "service": "' + service
           + '"}';
    var lambda = new AWS.Lambda();
    var params = {
        FunctionName: 'AAEGetItems',
        InvocationType: 'RequestResponse',
        LogType: 'None',
        Payload: lambdaEvent
    };
    lambda.invoke(params, function (err, data) {
        if (err) {
            console.log(err);
        }
        else {
            console.log(data);
            retval = JSON.parse(JSON.parse(data.Payload));
            var cell = document.getElementById(region + "_" + service);
            output = '';
            rawvalue = retval["count"];
            value = parseInt(rawvalue);
            if (value > 0) {
                output = value + retval["extra"];
            }
            cell.innerHTML = output;
            cell.style.backgroundColor = "#e6ffe6";
            updateStatus();
        }
    });
}

function describeEbs(data, region){
    var volumeStats = [
    [0, 0, 0], // gp2 #, in-use, total size
    [0, 0, 0], // io2 #, in-use, total size
    [0, 0, 0], // mag #, in-use, total size
    ];
    //collect the stats
    for (i = 0; i < data.Volumes.length; i++) {
        volume = data.Volumes[i];
        if (volume.VolumeType == 'gp2') { volType = 0 }
        if (volume.VolumeType == 'io1') { volType = 1 }
        if (volume.VolumeType == 'standard') { volType = 2 }
        volumeStats[volType][0] = volumeStats[volType][0] + 1;
        if (volume.State == 'in-use') {
            volumeStats[volType][1] = volumeStats[volType][1] + 1;
        }
        volumeStats[volType][2] = volumeStats[volType][2] + volume.Size;
    }
    var cell = document.getElementById(region + "_EBS");
    var output = '';

    if (volumeStats[0][0] != 0) {
        output = output + 'gp2(' + volumeStats[0][0] + '/' + volumeStats[0][1] + '/' + volumeStats[0][2] + ')';
        itemsAdded = true;
    }

    if (volumeStats[1][0] != 0) {
        if (itemsAdded == true) {
            output = output + '<br/>';
        }
        output = output + 'io1(' + volumeStats[1][0] + '/' + volumeStats[1][1] + '/' + volumeStats[1][2] + ')';
        itemsAdded = true;
    }

    if (volumeStats[2][0] != 0) {
        if (itemsAdded == true) {
            output = output + '<br/>';
        }
        output = output + 'mag(' + volumeStats[2][0] + '/' + volumeStats[2][1] + '/' + volumeStats[2][2] + ')';
        itemsAdded = true;
    }
    cell.innerHTML = output;
    cell.style.backgroundColor = "#e6ffe6";
    updateStatus();
}


function describeEc2(data, region){
    var i2, k2, count, runningCount = 0, stoppedCount = 0, terminatedCount = 0;
    count = 0;
    for (i2 = 0; i2 < data.Reservations.length; i2++) {
        for (k2 = 0; k2 < data.Reservations[i2].Instances.length; k2++) {
            if (data.Reservations[i2].Instances.length > 0) {
                count = count + data.Reservations[i2].Instances.length;
                var iIterator = 0;
                var stateCode;
                for (iIterator = 0; iIterator < data.Reservations[i2].Instances.length; iIterator++) {
                    stateCode = data.Reservations[i2].Instances[iIterator].State.Code;
                    console.log(stateCode)
                    if (stateCode == "16" || stateCode == "0")
                        runningCount = runningCount + 1;
                    if (stateCode == "80" || stateCode == "64")
                        stoppedCount = stoppedCount + 1;
                    if (stateCode == "48" || stateCode == "32")
                        terminatedCount = terminatedCount + 1;
                }
            }
        }
    }

    var output = '';
    if (count > 0) {
        output = count      + ' (<span style="color:green">' + runningCount + '</span>'
                            + '/<span style="color:red">' + stoppedCount + '</span>'
                            + '/<span style="color:black">' + terminatedCount + '</span>)';
    }

    var cell = document.getElementById(region + "_EC2");
    cell.innerHTML = output;
    cell.style.backgroundColor = "#e6ffe6";
    updateStatus();
}



function describeEip(data, region) {
    var i, j, count = 0, inuse = 0, detached = 0;
    for (i = 0; i < data.Addresses.length; i++) {
        count = count + 1;
        address = data.Addresses[i];
        if (address.InstanceId != null) {
            inuse = inuse + 1;
        }
    }

    var output = '';
    if (count > 0) {
        output = count + ' (<span style="color:green">' + inuse + '</span>'
                            + '/<span style="color:red">' + (count - inuse) + '</span>)';
    }

    var cell = document.getElementById(region + "_EIP");
    cell.innerHTML = output;
    cell.style.backgroundColor = "#e6ffe6";
    updateStatus();
}












