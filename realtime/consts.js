var consts = {
    mongo_uri: 'mongodb://test:test@localhost:27017/test',
    redis_uri: 'redis://localhost:6379/0',
    peer_id_prop: 'peer_id',
    peer_app_key_prop: 'app_key',
    webapi: {
        app_key_header: 'OB_APP_ID',
        app_secret_header: 'OB_APP_SECRET'
    },
    super_apps: [ // allowed apps in addition to apps store in data source
        {app_key: 'demo', app_secret: 'demo'}
    ]
};

module.exports = consts;