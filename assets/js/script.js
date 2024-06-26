jQuery(function($) {
    if ($('#gd_make_duplicates').length) {
        $("#gd_make_duplicates").on("click", function(e) {
            geodir_multilingual_wpml_duplicate(this, e);
        });
    }
    if ($('#geodir_copy_from_original').length && $('input#icl_cfo').length) {
        var lang, trid;
        lang = $('#geodir_copy_from_original').data('source_lang');
        trlang = $('#geodir_copy_from_original').data('tr_lang');
        trid = $('#geodir_copy_from_original').data('trid');
        if (lang && trid) {
            $("input#icl_cfo").attr('onclick', 'geodir_multilingual_wpml_copy_from_original(this, \'' + lang + '\', ' + trid + ', \'' + trlang + '\')');
        }
    }

    if ($('.geodir-tr-independent').length) {
        $(".geodir-tr-independent").on("click", function(e) {
            geodir_multilingual_wpml_remove_duplicate(this, e);
        });
    }
});

function geodir_multilingual_wpml_duplicate(el, e) {
    var $btn = jQuery(el);
    var $table = jQuery(el).closest('.gd-duplicate-table');
    var nonce = jQuery(el).data('nonce');
    var post_id = jQuery(el).data('post-id');
    var dups = [];

    jQuery.each(jQuery('input[name="gd_icl_dup[]"]:checked', $table), function() {
        dups.push(jQuery(this).val());
    });
    if (!dups.length || !post_id) {
        jQuery('input[name="gd_icl_dup[]"]', $table).trigger('focus');
        return false;
    }

    if (!confirm(geodir_multilingual_params.confirmDuplicate)) {
        return false;
    }

    var data = {
        action: 'geodir_wpml_duplicate',
        post_id: post_id,
        dups: dups.join(','),
        security: nonce
    };

    jQuery.ajax({
        url: geodir_params.ajax_url,
        data: data,
        type: 'POST',
        cache: false,
        dataType: 'json',
        beforeSend: function(xhr) {
            jQuery('.fa-spin', $table).show();
            $btn.attr('disabled', 'disabled');
        },
        success: function(res, status, xhr) {
            if (typeof res == 'object' && res) {
                if (res.data.message) {
                    alert(res.data.message);
                }
                if (res.success) {
                    window.location.href = document.location.href;
                    return;
                }
            }
        }
    }).complete(function(xhr, status) {
        jQuery('.fa-spin', $table).hide();
        $btn.removeAttr('disabled');
    });
}

function geodir_multilingual_wpml_remove_duplicate(el, e) {
    var $el = jQuery(el);
    var $parent = jQuery(el).parent();
    var nonce = jQuery(el).data('nonce');
    var post_id = jQuery(el).data('post-id');

    if (!confirm(geodir_multilingual_params.confirmTranslateIndependently)) {
        return false;
    }

    var data = {
        action: 'geodir_wpml_translate_independently',
        post_id: post_id,
        security: nonce
    };

    jQuery.ajax({
        url: geodir_params.ajax_url,
        data: data,
        type: 'POST',
        cache: false,
        dataType: 'json',
        beforeSend: function(xhr) {
            jQuery('.fa-spin', $parent).show();
            $el.attr('disabled', 'disabled');
        },
        success: function(res, status, xhr) {
            if (typeof res == 'object' && res) {
                if (res.data.message) {
                    alert(res.data.message);
                }
                if (res.success) {
                    if ($el.data('reload')) {
                        window.location.href = document.location.href;
                        return;
                    }
                    $el.remove();
                    jQuery('.geodir-translation-status', $parent).remove();
                }
            }
        }
    }).complete(function(xhr, status) {
        jQuery('.fa-spin', $parent).hide();
        $el.removeAttr('disabled');
    });
}

function geodir_multilingual_wpml_copy_from_original(el, lang, trid, trlang) {
    jQuery('#icl_cfo').after(icl_ajxloaderimg).attr('disabled', 'disabled');

    var $el = jQuery(el);
    var $form = jQuery('#geodir_post_info').closest('form');
    var ed;
    var content_type = (typeof tinyMCE !== 'undefined' && (ed = tinyMCE.get('content')) && !ed.isHidden() && ed.hasVisual === true) ? 'rich' : 'html';
    var excerpt_type = (typeof tinyMCE !== 'undefined' && (ed = tinyMCE.get('excerpt')) && !ed.isHidden() && ed.hasVisual === true) ? 'rich' : 'html';

    jQuery.ajax({
        type: "POST",
        dataType: 'json',
        url: icl_ajx_url,
        data: "icl_ajx_action=copy_from_original&lang=" + lang + '&trid=' + trid + '&content_type=' + content_type + '&excerpt_type=' + excerpt_type + '&_icl_nonce=' + jQuery('#_icl_nonce_cfo_' + trid).val() + '&trlang=' + trlang,
        success: function(res) {
            if (res.error) {
                alert(res.error);
            } else {
                try {
                    if (res.content) {
                        if (typeof tinyMCE !== 'undefined' && (ed = tinyMCE.get('content')) && !ed.isHidden()) {
                            ed.focus();
                            if (tinymce.isIE) {
                                ed.selection.moveToBookmark(tinymce.EditorManager.activeEditor.windowManager.bookmark);
                            }
                            ed.execCommand('mceInsertContent', false, res.content);
                        } else {
                            wpActiveEditor = 'content';
                            edInsertContent(edCanvas, res.content);
                        }
                    }
                    if (typeof res.title !== "undefined") {
                        jQuery('#title-prompt-text').hide();
                        jQuery('#title').val(res.title);
                    }

                    for (var element in res.builtin_custom_fields) {
                        var field = res.builtin_custom_fields[element];
                        if (res.builtin_custom_fields.hasOwnProperty(element) && res.builtin_custom_fields[element].editor_type === 'editor') {
                            if (typeof tinyMCE !== 'undefined' && (ed = tinyMCE.get(res.builtin_custom_fields[element].editor_name)) && !ed.isHidden()) {
                                ed.focus();
                                if (tinymce.isIE) {
                                    ed.selection.moveToBookmark(tinymce.EditorManager.activeEditor.windowManager.bookmark);
                                }
                                ed.execCommand('mceInsertContent', false, res.builtin_custom_fields[element].value);
                            } else {
                                wpActiveEditor = res.builtin_custom_fields[element].editor_name;
                                edInsertContent(edCanvas, res.builtin_custom_fields[element].value);
                            }

                            jQuery('body').trigger('geodir_multilingual_wpml_copy_editor_field', element, res, $form);
                        } else {
                            var name = field.editor_name;
                            var type = field.editor_type;
                            var value = field.value;
                            if (type == 'select') {
                                if (jQuery('select[name="' + name + '"]').length) {
                                    var $select = jQuery('select[name="' + name + '"]');
                                } else {
                                    var $select = jQuery('#' + name);
                                }
                                $select.find('option').removeAttr('selected');
                                $select.find('option[value="' + value + '"]').attr('selected', 'selected');
                            } else if (type == 'multiselect') {
                                if (jQuery('select[name="' + name + '[]"]').length) {
                                    var $select = jQuery('select[name="' + name + '[]"]');
                                } else {
                                    var $select = jQuery('#' + name);
                                }
                                if (value && value.length) {
                                    $select.find('option').removeAttr('selected');
                                    jQuery(value).each(function(i) {
                                        $select.find('option[value="' + value[i] + '"]').attr('selected', 'selected');
                                    });
                                }
                            } else if (type == 'checkbox') {
                                var value = parseInt(value) > 0 ? 1 : 0;
                                if (jQuery('input[name="' + name + '"]').length) {
                                    var $checkbox = 'input[name="' + name + '"]';
                                } else {
                                    var $checkbox = '#' + name;
                                }

                                if (jQuery($checkbox).parent().find('.gd-checkbox').length) {
                                    jQuery($checkbox).parent().find('.gd-checkbox').prop('checked', value);
                                } else {
                                    if (jQuery($checkbox).prop('type') == 'checkbox') {
                                        jQuery($checkbox).prop('checked', value);
                                    } else {
                                        jQuery($checkbox).val(value);
                                    }
                                }
                            } else if (type == 'multicheckbox') {
                                var $checkbox = jQuery('[name="' + name + '[]"]');
                                if (value && value.length) {
                                    jQuery(value).each(function(i) {
                                        jQuery('[name="' + name + '[]"][value="' + value[i] + '"]').attr('checked', 'checked');
                                    });
                                }
                            } else if (type == 'radio') {
                                if (jQuery('input[name="' + name + '"]').length) {
                                    var $radio = 'input[name="' + name + '"]';
                                } else {
                                    var $radio = '#' + name;
                                }
                                jQuery($radio).removeAttr('checked');
                                jQuery($radio + '[value="' + value + '"]').prop('checked', true);
                            } else if (type == 'file') {
                                if (jQuery('input[name="' + name + '"]').length) {
                                    var $field = jQuery('input[name="' + name + '"]');
                                } else {
                                    var $field = jQuery('#' + name);
                                }
                                $field.val(value);
                                if (jQuery("#" + name + "plupload-thumbs").length) {
                                    plu_show_thumbs(name);
                                }
                            } else if (type == 'business_hours') {
                                if (jQuery('input[name="' + name + '"]').length) {
                                    var $field = jQuery('input[name="' + name + '"]');
                                } else {
                                    var $field = jQuery('#' + name);
                                }
                                $field.val(value);
                                if (value) {
                                    i = '1';
                                    GeoDir_Business_Hours.init({
                                        'field': 'business_hours',
                                        'value': value,
                                        'json': '"' + value + '"',
                                        'offset': ''
                                    });
                                } else {
                                    i = '0';
                                }
                                jQuery('#' + name + '_f_active_' + i).prop('checked', true).trigger('change');
                            } else {
                                if (jQuery('[name="' + name + '"]').length) {
                                    jQuery('[name="' + name + '"]').val(value);
                                } else {
                                    jQuery('#' + name).val(value);
                                }
                            }

                            jQuery('body').trigger('geodir_multilingual_wpml_copy_field', name, value, type, element, res, $form);
                        }
                    }

                    if (typeof res.external_custom_fields !== "undefined") {
                        geodir_multilingual_wpml_copy_external_custom_fields(res.external_custom_fields);
                    }

                    $form.find('select').trigger("change.select2");

                    if (jQuery('[name="latitude"]').val() && jQuery('[name="longitude"]').val()) {
                        if (window.gdMaps == 'google') {
                            latlon = new google.maps.LatLng(jQuery('[name="latitude"]').val(), jQuery('[name="longitude"]').val());
                            jQuery.goMap.map.setCenter(latlon);
                            updateMarkerPosition(latlon);
                            centerMarker();
                        } else if (window.gdMaps == 'osm') {
                            latlon = new L.latLng(jQuery('[name="latitude"]').val(), jQuery('[name="longitude"]').val());
                            jQuery.goMap.map.setView(latlon, jQuery.goMap.map.getZoom());
                            updateMarkerPositionOSM(latlon);
                            centerMarker();
                        }
                    }

                    jQuery('body').trigger('geodir_multilingual_wpml_field_copied', res, $form);
                } catch (err) {
                    console.log(err);
                }
            }
            jQuery('#icl_cfo').next().fadeOut();
        }
    });

    return false;
}

function geodir_multilingual_wpml_copy_external_custom_fields(custom_fields) {
    var geodir_wpml_external_custom_fields = jQuery("#postcustomstuff #the-list tr input").length > 0;
    if (geodir_wpml_external_custom_fields) {
        return;
    }

    var container = jQuery("#newmeta");
    var meta_key_field = container.find("#metakeyselect");
    var meta_value_field = container.find("#metavalue");
    var add_button = container.find("#newmeta-submit");

    custom_fields.forEach(function(item) {
        meta_key_field.val(item.name);
        meta_value_field.val(item.value);
        add_button.trigger('click');
    });
}