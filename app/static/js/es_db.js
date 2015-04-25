var CONF, es_get_all, es_put;

CONF = {
    DB: 'db'
};

function _es_db(db_req, callback) {
    return $.ajax({
        url: CONF.DB,
        type: 'POST',
        data: db_req,
        success: function(data) {
            console.log(data);
            callback(data);
        },
        error: function(error) {
            console.log(error.responseText);
        }
    });
}

es_put = function(type_name, data, callback) {
    var db_req = JSON.stringify({
        index: type_name + "/",
        method: 'POST',
        query: JSON.stringify(data)});
    _es_db(db_req, callback);
};

es_put_id = function(type_name, id, data, callback) {
    var db_req = JSON.stringify({
        index: type_name + "/" + id,
        method: 'PUT',
        query: JSON.stringify(data)});
    _es_db(db_req, callback);
};

es_get_id = function(type_name, id, callback) {
    var db_req = JSON.stringify({
        index: type_name + "/" + id,
        method: 'GET',
        query: ''});
    _es_db(db_req, callback);
};

es_get_all = function(type_name, callback) {
    var db_req = JSON.stringify({
        index: type_name + "/_search",
        method: 'GET',
        query: ''});
    _es_db(db_req, callback)
};
