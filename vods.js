var trHeaders = {
    'Client-ID':'vnrs0l8wxp8ptn41b3nphjbmfuar27'
    //'Authorization':  'Bearer ' + OAUTH_ACCESS_TOKEN
};

var base_url = 'https://api.twitch.tv/helix/';
var twitch_url = 'https://www.twitch.tv/';
var videos = null;
var queryLimit = false;

function p() {
    $('.loader').hide();
    var id = getUrlParameter('login_id');
    if (id) {
        p2(id);
    }
    $('#query').click(() => {
        var id = $('#login_id').val();
        p2(id);
    });
    window.onscroll = (e) => {
        if ((window.innerHeight + window.pageYOffset) >= document.body.offsetHeight - 200) {
            loadMore();
        }
    };
}

function p2(id) {
    $('#input_body').hide();
    $('.loader').show();
    var user = getUser(id);
    if (user == null) {
        $('.progress').append("guery user not success.");
        $('.loader').hide();
        return;
    }

    var following = getFollowing(user.id).map(v => v.to_id);
    $('.progress').append("Your following length: " + following.length + " . Wait for querying data");

    videos = getUserByIds(following).map(v => [v, null]);
    var f = () => {
        queryLimit = false;
        videos.map(v => {
            if (v[1] == null) v[1] = getVideos(v[0].id);
            return v;
        });

        var unQuery = videos.filter(v => v[1] == null);
        if (unQuery.length > 0) {
            $('.progress').append($('<div>').html("got query limit. unquery length: " + unQuery.length + " . Wait for querying data"));
            setTimeout(f, 60 * 1000);
        } else {
            videos = videos.map(v => {
                return v[1].map(x => {
                    x.user = v[0];
                    return x;
                });
            }).reduce((t, v) => t.concat(v)).map(v => {
                v.created_at = new Date(v.created_at);
                return v;
            }).sort((a, b) => a.created_at < b.created_at ? 1 : -1).filter(v => {
                    var duration = v.duration;
                    var d = 0;
                    var h = 0;
                    var m = 0;
                    var s = 0;
                    duration.split('d').forEach(v => $.isNumeric(v) ? d = parseInt(v): duration = v);
                    duration.split('h').forEach(v => $.isNumeric(v) ? h = parseInt(v): duration = v);
                    duration.split('m').forEach(v => $.isNumeric(v) ? m = parseInt(v): duration = v);
                    duration.split('s').forEach(v => $.isNumeric(v) ? s = parseInt(v): duration = v);

                    h += d * 24;
                    m += h * 60;
                    return m >= 2;
            }).map((v, i, a) => {
                if (i % 5 === 0) return a.slice(i, i + 5);
                else return null;
            }).filter(v => v != null);

            $('.progress').hide();
            loadMore();
            loadMore();
        }
    };
    setTimeout(f, 0);
}

function loadMore() {
    if (videos == null) return;
    if (videos.length == 0) return;
    videos[0].forEach(v => {
        var video = $('<div>').attr("class", "video");
        var profile_img = $('<img>').attr("src", v.user.profile_image_url).attr("class", "profile");
        var profile = $('<a>').attr("href", twitch_url + v.user.login).append(profile_img);
        var title = $('<span>').attr("class", "title").html(v.title);
        var display_name = $('<span>').attr("class", "display_name").html(v.user.display_name);
        var duration = $('<span>').attr("class", "duration").html(v.duration);
        video.append(duration);
        video.append(getThumbLink(v, 0));
        video.append(getThumbLink(v, 1));
        video.append(getThumbLink(v, 2));
        video.append(getThumbLink(v, 3));
        video.append($('<div>').attr("class", "clear"));
        video.append(profile);
        video.append(title);
        video.append("<br>");
        video.append(display_name);
        video.append(v.created_at);
        video.append($('<div>').attr("class", "clear"));

        //video.append(JSON.stringify(v));
        $('.list').append(video);
    });

    videos = videos.slice(1);
}

function getThumbLink(v, thumbIndex) {
    var thumbnail_url = v.thumbnail_url.replace("%{width}", "284").replace("%{height}", "160").replace("thumb0", "thumb" + thumbIndex);
    var img = $('<img>').attr("src", thumbnail_url);
    var link = $('<a>').attr("href", v.url).append(img);
    return $('<div>').attr("class", "thumb_link").append(link)
}

function getVideos(user_id) {
    var query = {};
    query.url = 'videos';
    query.data = {};
    query.data.user_id = user_id;
    query.data.type = 'archive';
    query.data.first = 100;
    return runTwitch(query);
}

function getUser(login) {
    var query = {};
    query.url = 'users';
    query.data = {};
    query.data.login = login;
    return runTwitch(query)[0];
}

function getUserById(id) {
    var query = {};
    query.url = 'users';
    query.data = {};
    query.data.id = id;
    return runTwitch(query)[0];
}

function getUserByIds(id) {
    var query = {};
    query.url = 'users';
    query.data = {};
    query.data.id = id;
    return runTwitch(query);
}

function getFollowing(from_id) {
    var query = {};
    query.url = 'users/follows';
    query.data = {};
    query.data.from_id = from_id;
    query.data.first = 100;
    return runTwitch(query);
}

function runTwitch(query) {
    if (queryLimit) return null;
    //$('.progress').append(JSON.stringify(query));
    //$('.progress').show();
    $.ajaxSetup({
        async: false
    });

    var result = null;
    $.ajax({
        type:'GET',
        url:base_url + query.url,
        dataType:'json',
        headers:trHeaders,
        data:query.data,
    }).done((data) => {
        result = data.data;
        //$('.progress').append("done");
    }).fail(() => {
        queryLimit = true;
    //$('.progress').append("fail");
    });

    //$('.progress').append("<br>");
    return result;
}

var getUrlParameter = function getUrlParameter(sParam) {
    var sPageURL = decodeURIComponent(window.location.search.substring(1)),
        sURLVariables = sPageURL.split('&'),
        sParameterName,
        i;

    for (i = 0; i < sURLVariables.length; i++) {
        sParameterName = sURLVariables[i].split('=');

        if (sParameterName[0] === sParam) {
            return sParameterName[1] === undefined ? true : sParameterName[1];
        }
    }
};
//alert(JSON.stringify(charObj));
