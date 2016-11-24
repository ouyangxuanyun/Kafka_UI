$().ready(function () {
    $("#check_form").validate({
        errorPlacement: function (error, element) {
            element.next().remove();
            element.after('<span class="glyphicon glyphicon-remove form-control-feedback" aria-hidden="true"></span>');
            element.closest('.form-group').append(error);
        },
        highlight: function (element) {
            $(element).closest('.form-group').addClass('has-error has-feedback');
        },
        success: function (label) {
            var el = label.closest('.form-group').find("input");
            el.next().remove();
            el.after('<span class="glyphicon glyphicon-ok form-control-feedback" aria-hidden="true"></span>');
            label.closest('.form-group').removeClass('has-error').addClass("has-feedback has-success");
            label.remove();
        },
        errorElement: 'span',
        errorClass: 'help-block',
        rules: {
            name: 'required',
            zkHosts: 'required',
            'tuning.brokerViewUpdatePeriodSeconds': {
                required: true,
                range: [10, 1000]
            },
            'tuning.clusterManagerThreadPoolSize': {
                required: true,
                range: [2, 1000]
            },
            'tuning.clusterManagerThreadPoolQueueSize': {
                required: true,
                range: [10, 1000]
            },
            'tuning.kafkaCommandThreadPoolSize': {
                required: true,
                range: [2, 1000]
            },
            'tuning.kafkaCommandThreadPoolQueueSize': {
                required: true,
                range: [10, 1000]
            },
            'tuning.logkafkaCommandThreadPoolSize': {
                required: true,
                range: [2, 1000]
            },
            'tuning.logkafkaCommandThreadPoolQueueSize': {
                required: true,
                range: [10, 1000]
            },
            'tuning.logkafkaUpdatePeriodSeconds': {
                required: true,
                range: [10, 1000]
            },
            'tuning.partitionOffsetCacheTimeoutSecs': {
                required: true,
                range: [5, 1000]
            },
            'tuning.': {
                required: true,
                range: [10, 1000]
            },
            'tuning.brokerViewThreadPoolSize': {
                required: true,
                range: [2, 1000]
            },
            'tuning.brokerViewThreadPoolQueueSize': {
                required: true,
                range: [10, 1000]
            },
            'tuning.offsetCacheThreadPoolSize': {
                required: true,
                range: [2, 1000]
            },
            'tuning.offsetCacheThreadPoolQueueSize': {
                required: true,
                range: [10, 1000]
            },
            'tuning.kafkaAdminClientThreadPoolSize': {
                required: true,
                range: [2, 1000]
            },
            'tuning.kafkaAdminClientThreadPoolQueueSize': {
                required: true,
                range: [10, 1000]
            }
        }
    });
});
