// Generated by CoffeeScript 2.7.0
(function() {
  // vim: set et sw=2 ts=2 sts=2 ff=unix fenc=utf8:
  // Author: Binux<i@binux.me>
  //         http://binux.me
  // Created on 2014-08-06 21:16:15
  define(function(require, exports, module) {
    var api_host, utils;
    require('/static/har/contenteditable');
    require('/static/har/editablelist');
    utils = require('/static/components/utils');
    // local_protocol = window.location.protocol
    // local_host = window.location.host
    api_host = "api:/";
    return angular.module('entry_editor', ['contenteditable']).controller('EntryCtrl', function($scope, $rootScope, $sce, $http) {
      var changing;
      // init
      $scope.panel = 'request';
      $scope.copy_entry = null;
      // on edit event
      $scope.$on('edit-entry', function(ev, entry) {
        var base, base1, base2;
        console.info(entry);
        $scope.entry = entry;
        if ((base = $scope.entry).success_asserts == null) {
          base.success_asserts = [
            {
              re: '' + $scope.entry.response.status,
              from: 'status'
            }
          ];
        }
        if ((base1 = $scope.entry).failed_asserts == null) {
          base1.failed_asserts = [];
        }
        if ((base2 = $scope.entry).extract_variables == null) {
          base2.extract_variables = [];
        }
        $scope.copy_entry = JSON.parse(utils.storage.get('copy_request'));
        angular.element('#edit-entry').modal('show');
        return $scope.alert_hide();
      });
      // on show event
      // angular.element('#edit-entry').on('show.bs.modal', (ev) ->
      //   $rootScope.$broadcast('har-change')
      // )

      // on saved event
      angular.element('#edit-entry').on('hidden.bs.modal', function(ev) {
        var ref;
        if ((ref = $scope.panel) === 'preview-headers' || ref === 'preview') {
          $scope.$apply(function() {
            var env, i, len, ref1, ret, rule;
            $scope.panel = 'test';
            // update env from extract_variables
            env = utils.list2dict($scope.env);
            ref1 = $scope.entry.extract_variables;
            for (i = 0, len = ref1.length; i < len; i++) {
              rule = ref1[i];
              if (ret = typeof $scope.preview_match === "function" ? $scope.preview_match(rule.re, rule.from) : void 0) {
                env[rule.name] = ret;
              }
            }
            return $scope.env = utils.dict2list(env);
          });
        }
        $scope.$apply(function() {
          return $scope.preview = void 0;
        });
        console.debug('har-change');
        return $rootScope.$broadcast('har-change');
      });
      // alert message for test panel
      $scope.alert = function(message) {
        return angular.element('.panel-test .alert').text(message).show();
      };
      $scope.alert_hide = function() {
        return angular.element('.panel-test .alert').hide();
      };
      // sync url with query string
      changing = '';
      $scope.$watch('entry.request.url', function() {
        var error, queryString;
        if (changing && changing !== 'url') {
          changing = '';
          return;
        }
        if ($scope.entry == null) {
          return;
        }
        if ($scope.entry.request.url.substring(0, 2) === "{{" || $scope.entry.request.url.substring(0, 2) === "{%") {
          return;
        }
        try {
          queryString = utils.dict2list(utils.querystring_parse_with_variables(utils.url_parse($scope.entry.request.url).query));
        } catch (error1) {
          error = error1;
          queryString = [];
        }
        if (!changing && !angular.equals(queryString, $scope.entry.request.queryString)) {
          $scope.entry.request.queryString = queryString;
          return changing = 'url';
        }
      });
      // sync query string with url
      $scope.$watch('entry.request.queryString', (function() {
        var query, url;
        if (changing && changing !== 'qs') {
          changing = '';
          return;
        }
        if ($scope.entry == null) {
          return;
        }
        if ($scope.entry.request.url.substring(0, 2) === "{{" || $scope.entry.request.url.substring(0, 2) === "{%") {
          return;
        }
        url = utils.url_parse($scope.entry.request.url);
        if ((url != null) && url.path.indexOf('%7B%7B') > -1) {
          url.path = url.path.replace('%7B%7B', '{{');
          url.path = url.path.replace('%7D%7D', '}}');
          url.pathname = url.pathname.replace('%7B%7B', '{{');
          url.pathname = url.pathname.replace('%7D%7D', '}}');
        }
        url.path = url.path.replace('https:///', 'https://');
        query = utils.list2dict($scope.entry.request.queryString);
        query = utils.querystring_unparse_with_variables(query);
        if (query) {
          url.search = `?${query}`;
        }
        url = utils.url_unparse(url);
        if (!changing && url !== $scope.entry.request.url) {
          $scope.entry.request.url = url;
          return changing = 'qs';
        }
      }), true);
      // sync params with text
      $scope.$watch('entry.request.postData.params', (function() {
        var obj, ref, ref1;
        if (((ref = $scope.entry) != null ? (ref1 = ref.request) != null ? ref1.postData : void 0 : void 0) == null) {
          return;
        }
        obj = utils.list2dict($scope.entry.request.postData.params);
        return $scope.entry.request.postData.text = utils.querystring_unparse_with_variables(obj);
      }), true);
      // $scope.$watch('entry.request.postData.text', (function() {
      //   var obj, ref, ref1;
      //   if (((ref = $scope.entry) != null ? (ref1 = ref.request) != null ? ref1.postData : void 0 : void 0) == null) {
      //     return;
      //   }
      //   obj = utils.querystring_parse($scope.entry.request.postData.text);
      //   return $scope.entry.request.postData.params = utils.dict2list(obj);
      // }), true);

      // helper for delete item from array
      $scope.delete = function(hashKey, array) {
        var each, i, index, len;
        for (index = i = 0, len = array.length; i < len; index = ++i) {
          each = array[index];
          if (each.$$hashKey === hashKey) {
            array.splice(index, 1);
            return;
          }
        }
      };
      // variables template
      $scope.variables_wrapper = function(string, place_holder = '') {
        var re;
        string = (string || place_holder).toString();
        re = /{{\s*([\w]+)[^}]*?\s*}}/g;
        return $sce.trustAsHtml(string.replace(re, '<span class="label label-primary">$&</span>'));
      };
      $scope.insert_request = function(pos, entry) {
        var current_pos;
        if (pos == null) {
          pos = 1;
        }
        if ((current_pos = $scope.$parent.har.log.entries.indexOf($scope.entry)) === -1) {
          $scope.alert("can't find position to add request");
          return;
        }
        current_pos += pos;
        $scope.$parent.har.log.entries.splice(current_pos, 0, entry);
        $rootScope.$broadcast('har-change');
        angular.element('#edit-entry').modal('hide');
        return true;
      };
      $scope.add_request = function(pos) {
        return $scope.insert_request(pos, {
          checked: false,
          pageref: $scope.entry.pageref,
          recommend: true,
          request: {
            method: 'GET',
            url: '',
            postData: {
              text: ''
            },
            headers: [],
            cookies: []
          },
          response: {}
        });
      };
      $scope.add_for_start = function() {
        return $scope.insert_request(1, {
          checked: true,
          pageref: $scope.entry.pageref,
          recommend: true,
          comment: '循环开始',
          request: {
            method: 'GET',
            url: '{% for variable in variables %}',
            postData: {
              text: ''
            },
            headers: [],
            cookies: []
          },
          response: {},
          success_asserts: []
        });
      };
      $scope.add_for_end = function() {
        return $scope.insert_request(1, {
          checked: true,
          pageref: $scope.entry.pageref,
          recommend: true,
          comment: '循环块结束',
          request: {
            method: 'GET',
            url: '{% endfor %}',
            postData: {
              text: ''
            },
            headers: [],
            cookies: []
          },
          response: {},
          success_asserts: []
        });
      };
      $scope.add_if_start = function() {
        return $scope.insert_request(1, {
          checked: true,
          pageref: $scope.entry.pageref,
          recommend: true,
          comment: '判断条件成立',
          request: {
            method: 'GET',
            url: '{% if Conditional_Expression %}',
            postData: {
              text: ''
            },
            headers: [],
            cookies: []
          },
          response: {},
          success_asserts: []
        });
      };
      $scope.add_if_else = function() {
        return $scope.insert_request(1, {
          checked: true,
          pageref: $scope.entry.pageref,
          recommend: true,
          comment: '判断条件不成立',
          request: {
            method: 'GET',
            url: '{% else %}',
            postData: {
              text: ''
            },
            headers: [],
            cookies: []
          },
          response: {},
          success_asserts: []
        });
      };
      $scope.add_if_end = function() {
        return $scope.insert_request(1, {
          checked: true,
          pageref: $scope.entry.pageref,
          recommend: true,
          comment: '判断块结束',
          request: {
            method: 'GET',
            url: '{% endif %}',
            postData: {
              text: ''
            },
            headers: [],
            cookies: []
          },
          response: {},
          success_asserts: []
        });
      };
      $scope.add_timestamp_request = function() {
        return $scope.insert_request(1, {
          checked: true,
          pageref: $scope.entry.pageref,
          recommend: true,
          comment: '返回当前时间戳和时间',
          request: {
            method: 'GET',
            url: [api_host, '/util/timestamp'].join(''),
            postData: {
              text: ''
            },
            headers: [],
            cookies: []
          },
          response: {},
          success_asserts: [
            {
              re: "200",
              from: "status"
            }
          ]
        });
      };
      $scope.add_delay_request = function() {
        return $scope.insert_request(1, {
          checked: true,
          pageref: $scope.entry.pageref,
          recommend: true,
          comment: '延时3秒',
          request: {
            method: 'GET',
            url: [api_host, '/util/delay/3'].join(''),
            postData: {
              text: ''
            },
            headers: [],
            cookies: []
          },
          response: {},
          success_asserts: [
            {
              re: "200",
              from: "status"
            }
          ]
        });
      };
      $scope.add_unicode_request = function() {
        return $scope.insert_request(1, {
          checked: true,
          pageref: $scope.entry.pageref,
          recommend: true,
          comment: 'Unicode转换',
          request: {
            method: 'POST',
            url: [api_host, '/util/unicode'].join(''),
            headers: [],
            cookies: [],
            postData: {
              text: "content="
            }
          },
          response: {},
          success_asserts: [
            {
              re: "200",
              from: "status"
            },
            {
              re: "\"状态\": \"200\"",
              from: "content"
            }
          ],
          extract_variables: [
            {
              name: '',
              re: '"转换后": "(.*)"',
              from: 'content'
            }
          ]
        });
      };
      $scope.add_urldecode_request = function() {
        return $scope.insert_request(1, {
          checked: true,
          pageref: $scope.entry.pageref,
          recommend: true,
          comment: 'URL解码',
          request: {
            method: 'POST',
            url: [api_host, '/util/urldecode'].join(''),
            headers: [],
            cookies: [],
            postData: {
              text: "content="
            }
          },
          response: {},
          success_asserts: [
            {
              re: "200",
              from: "status"
            },
            {
              re: "\"状态\": \"200\"",
              from: "content"
            }
          ],
          extract_variables: [
            {
              name: '',
              re: '"转换后": "(.*)"',
              from: 'content'
            }
          ]
        });
      };
      $scope.add_gb2312_request = function() {
        return $scope.insert_request(1, {
          checked: true,
          pageref: $scope.entry.pageref,
          recommend: true,
          comment: 'GB2312编码',
          request: {
            method: 'POST',
            url: [api_host, '/util/gb2312'].join(''),
            headers: [],
            cookies: [],
            postData: {
              text: "content="
            }
          },
          response: {},
          success_asserts: [
            {
              re: "200",
              from: "status"
            },
            {
              re: "\"状态\": \"200\"",
              from: "content"
            }
          ],
          extract_variables: [
            {
              name: '',
              re: '"转换后": "(.*)"',
              from: 'content'
            }
          ]
        });
      };
      $scope.add_regex_request = function() {
        return $scope.insert_request(1, {
          checked: true,
          pageref: $scope.entry.pageref,
          recommend: true,
          comment: '正则提取',
          request: {
            method: 'POST',
            url: [api_host, '/util/regex'].join(''),
            headers: [],
            cookies: [],
            postData: {
              text: "p=&data="
            }
          },
          response: {},
          success_asserts: [
            {
              re: "200",
              from: "status"
            },
            {
              re: "\"状态\": \"OK\"",
              from: "content"
            }
          ],
          extract_variables: [
            {
              name: '',
              re: '"1": "(.*)"',
              from: 'content'
            }
          ]
        });
      };
      $scope.add_string_replace_request = function() {
        return $scope.insert_request(1, {
          checked: true,
          pageref: $scope.entry.pageref,
          recommend: true,
          comment: '字符串替换',
          request: {
            method: 'POST',
            url: [api_host, '/util/string/replace'].join(''),
            headers: [],
            cookies: [],
            postData: {
              text: "r=json&p=&s=&t="
            }
          },
          response: {},
          success_asserts: [
            {
              re: "200",
              from: "status"
            },
            {
              re: "\"状态\": \"OK\"",
              from: "content"
            }
          ],
          extract_variables: [
            {
              name: '',
              re: '"处理后字符串": "(.*)"',
              from: 'content'
            }
          ]
        });
      };
      $scope.add_RSA_Encrypt_request = function() {
        return $scope.insert_request(1, {
          checked: true,
          pageref: $scope.entry.pageref,
          recommend: true,
          comment: 'RSA加密',
          request: {
            method: 'POST',
            url: [api_host, '/util/rsa'].join(''),
            headers: [],
            cookies: [],
            postData: {
              text: "f=encode&key=&data="
            }
          },
          response: {},
          success_asserts: [
            {
              re: "200",
              from: "status"
            }
          ],
          extract_variables: [
            {
              name: '',
              re: '(.*)',
              from: 'content'
            }
          ]
        });
      };
      $scope.add_RSA_Decrypt_request = function() {
        return $scope.insert_request(1, {
          checked: true,
          pageref: $scope.entry.pageref,
          recommend: true,
          comment: 'RSA解密',
          request: {
            method: 'POST',
            url: [api_host, '/util/rsa'].join(''),
            headers: [],
            cookies: [],
            postData: {
              text: "f=decode&key=&data="
            }
          },
          response: {},
          success_asserts: [
            {
              re: "200",
              from: "status"
            }
          ],
          extract_variables: [
            {
              name: '',
              re: '(.*)',
              from: 'content'
            }
          ]
        });
      };
      $scope.add_read_notepad_request = function() {
        return $scope.insert_request(1, {
          checked: true,
          pageref: $scope.entry.pageref,
          recommend: true,
          comment: '读取记事本',
          variables: {
            qd_email: "",
            qd_pwd: ""
          },
          request: {
            method: 'POST',
            url: [api_host, '/util/toolbox/notepad'].join(''),
            headers: [],
            cookies: [],
            postData: {
              text: "email={{qd_email|urlencode}}&pwd={{md5(qd_pwd)|urlencode}}&id_notepad=1&f=read"
            }
          },
          response: {},
          success_asserts: [
            {
              re: "200",
              from: "status"
            }
          ],
          extract_variables: [
            {
              name: '',
              re: '([\s\S]*)',
              from: 'content'
            }
          ]
        });
      };
      $scope.add_append_notepad_request = function() {
        return $scope.insert_request(1, {
          checked: true,
          pageref: $scope.entry.pageref,
          recommend: true,
          comment: '追加记事本',
          request: {
            method: 'POST',
            url: [api_host, '/util/toolbox/notepad'].join(''),
            headers: [],
            cookies: [],
            postData: {
              text: "email={{qd_email|urlencode}}&pwd={{md5(qd_pwd)|urlencode}}&id_notepad=1&f=append&data={{notebook_content|urlencode}}"
            }
          },
          response: {},
          success_asserts: [
            {
              re: "200",
              from: "status"
            }
          ],
          extract_variables: [
            {
              name: '',
              re: '([\s\S]*)',
              from: 'content'
            }
          ]
        });
      };
      $scope.add_dddd_OCR_request = function() {
        return $scope.insert_request(1, {
          checked: true,
          pageref: $scope.entry.pageref,
          recommend: true,
          comment: 'OCR识别',
          request: {
            method: 'POST',
            url: [api_host, '/util/dddd/ocr'].join(''),
            headers: [
              {
                "name": "Content-Type",
                "value": "application/json",
                "checked": true
              }
            ],
            cookies: [],
            postData: {
              text: "{\"img\":\"\",\"imgurl\":\"\",\"old\":\"False\",\"extra_onnx_name\":\"\"}"
            }
          },
          response: {},
          success_asserts: [
            {
              re: "200",
              from: "status"
            },
            {
              re: "\"状态\": \"OK\"",
              from: "content"
            }
          ],
          extract_variables: [
            {
              name: '',
              re: '"Result": "(.*)"',
              from: 'content'
            }
          ]
        });
      };
      $scope.add_dddd_DET_request = function() {
        return $scope.insert_request(1, {
          checked: true,
          pageref: $scope.entry.pageref,
          recommend: true,
          comment: '目标检测',
          request: {
            method: 'POST',
            url: [api_host, '/util/dddd/det'].join(''),
            headers: [
              {
                "name": "Content-Type",
                "value": "application/json",
                "checked": true
              }
            ],
            cookies: [],
            postData: {
              text: "{\"img\":\"\",\"imgurl\":\"\"}"
            }
          },
          response: {},
          success_asserts: [
            {
              re: "200",
              from: "status"
            },
            {
              re: "\"状态\": \"OK\"",
              from: "content"
            }
          ],
          extract_variables: [
            {
              name: '',
              re: '(\\d+, \\d+, \\d+, \\d+)',
              from: 'content'
            },
            {
              name: '',
              re: '/(\\d+, \\d+, \\d+, \\d+)/g',
              from: 'content'
            }
          ]
        });
      };
      $scope.copy_request = function() {
        if (!$scope.entry) {
          $scope.alert("can't find position to paste request");
          return;
        }
        $scope.copy_entry = angular.copy($scope.entry);
        return utils.storage.set('copy_request', angular.toJson($scope.copy_entry));
      };
      $scope.paste_request = function(pos) {
        var base;
        if ((base = $scope.copy_entry).comment == null) {
          base.comment = '';
        }
        $scope.copy_entry.comment = 'Copy_' + $scope.copy_entry.comment;
        $scope.copy_entry.pageref = $scope.entry.pageref;
        return $scope.insert_request(pos, $scope.copy_entry);
      };
      $scope.del_request = function(pos) {
        var current_pos;
        if (pos === null) {
          pos = 1;
        }
        if ((current_pos = $scope.$parent.har.log.entries.indexOf($scope.entry)) === -1) {
          $scope.alert("can't find position to add request");
          return;
        }
        current_pos += pos;
        $scope.$parent.har.log.entries.splice(current_pos, 1);
        $rootScope.$broadcast('har-change');
        return angular.element('#edit-entry').modal('hide');
      };
      // fetch test
      return $scope.do_test = function() {
        var c, h, ref, ref1;
        NProgress.start();
        angular.element('.do-test').button('loading');
        NProgress.inc();
        $http.post('/har/test', {
          request: {
            method: $scope.entry.request.method,
            url: $scope.entry.request.url,
            headers: (function() {
              var i, len, ref, results;
              ref = $scope.entry.request.headers;
              results = [];
              for (i = 0, len = ref.length; i < len; i++) {
                h = ref[i];
                if (h.checked) {
                  results.push({
                    name: h.name,
                    value: h.value
                  });
                }
              }
              return results;
            })(),
            cookies: (function() {
              var i, len, ref, results;
              ref = $scope.entry.request.cookies;
              results = [];
              for (i = 0, len = ref.length; i < len; i++) {
                c = ref[i];
                if (c.checked) {
                  results.push({
                    name: c.name,
                    value: c.value
                  });
                }
              }
              return results;
            })(),
            data: (ref = $scope.entry.request.postData) != null ? ref.text : void 0,
            mimeType: (ref1 = $scope.entry.request.postData) != null ? ref1.mimeType : void 0
          },
          rule: {
            success_asserts: $scope.entry.success_asserts,
            failed_asserts: $scope.entry.failed_asserts,
            extract_variables: $scope.entry.extract_variables
          },
          env: {
            variables: utils.list2dict($scope.env),
            session: $scope.session
          }
        }).then(function(res) {
          var config, data, headers, ref2, ref3, status;
          NProgress.inc();
          data = res.data;
          status = res.status;
          headers = res.headers;
          config = res.config;
          angular.element('.do-test').button('reset');
          if (status !== 200) {
            $scope.alert(data);
            return;
          }
          $scope.preview = data.har;
          $scope.preview.success = data.success;
          $scope.env = utils.dict2list(data.env.variables);
          $scope.session = data.env.session;
          $scope.panel = 'preview';
          if (((ref2 = data.har.response) != null ? (ref3 = ref2.content) != null ? ref3.text : void 0 : void 0) != null) {
            setTimeout((function() {
              return angular.element('.panel-preview iframe').attr("src", `data:${data.har.response.content.mimeType};base64,${data.har.response.content.text}`);
            }), 0);
          }
          return NProgress.done();
        }, function(res) {
          var config, data, headers, status;
          data = res.data;
          status = res.status;
          headers = res.headers;
          config = res.config;
          angular.element('.do-test').button('reset');
          console.error('Error_Message', res);
          $scope.alert(data || res.statusText || 'net::ERR_CONNECTION_REFUSED');
          return NProgress.done();
        });
        NProgress.inc();
        $scope.preview_match = function(re, from) {
          var content, data, error, header, i, len, m, match, ref2, ref3, result, tmp;
          data = null;
          if (!from) {
            return null;
          } else if (from === 'content') {
            if (typeof $scope.preview === 'undefined') {
              return false;
            }
            content = (ref2 = $scope.preview.response) != null ? ref2.content : void 0;
            if ((content == null) || (content.text == null)) {
              return null;
            }
            if (!content.decoded) {
              content.decoded = atob(content.text);
            }
            data = content.decoded;
          } else if (from === 'status' & $scope.preview !== void 0) {
            data = '' + $scope.preview.response.status;
          } else if (from.indexOf('header-') === 0) {
            from = from.slice(7);
            ref3 = $scope.preview.response.headers;
            for (i = 0, len = ref3.length; i < len; i++) {
              header = ref3[i];
              if (header.name.toLowerCase() === from) {
                data = header.value;
              }
            }
          } else if (from === 'header') {
            data = ((function() {
              var j, len1, ref4, results;
              ref4 = $scope.preview.response.headers;
              results = [];
              for (j = 0, len1 = ref4.length; j < len1; j++) {
                h = ref4[j];
                results.push(h.name + ': ' + h.value);
              }
              return results;
            })()).join("\n");
          }
          if (!data) {
            return null;
          }
          try {
            if (match = re.match(/^\/(.*?)\/([gimsu]*)$/)) {
              if (match[1]) {
                re = new RegExp(match[1], match[2]);
              } else {
                throw new Error(match[0](+' is not allowed!'));
              }
            } else {
              re = new RegExp(re);
            }
          } catch (error1) {
            error = error1;
            console.error(error.message);
            return error.message;
          }
          if (re.global) {
            try {
              result = [];
              tmp = re.lastIndex;
              while (m = re.exec(data)) {
                result.push(m[1] ? m[1] : m[0]);
                if (m[0] === '') {
                  re.lastIndex++;
                }
              }
            } catch (error1) {
              // throw new Error('the RegExp "' + re.toString() +'" has caused a loop error! Try using stringObject.match(regexp) method on this stringobject...' )
              error = error1;
              console.error(error.message);
              result = data.match(re);
            }
            console.log('The original result is ', result);
            console.log('The result of toString() is ' + result.toString());
            return result;
          } else {
            if (m = data.match(re)) {
              if (m[1]) {
                return m[1];
              } else {
                return m[0];
              }
            }
            // return m[1]
            return null;
          }
          return NProgress.inc();
        };
        return NProgress.inc();
      };
    });
  });

  //# eof

}).call(this);
