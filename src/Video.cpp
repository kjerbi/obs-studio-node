#include "Common.h"
#include "Video.h"

/**
 * A wrapper over video_t and 
 * associated media-io functionality
 */
namespace osn {

/*
 * Video (video_t) and associated functions
 */
Nan::Persistent<v8::FunctionTemplate> Video::prototype = 
    Nan::Persistent<v8::FunctionTemplate>();

Video::Video(obs::video video)
 : handle(video)
{
}

NAN_MODULE_INIT(Video::Init)
{
    auto locProto = Nan::New<v8::FunctionTemplate>();
    locProto->SetClassName(FIELD_NAME("Audio"));
    locProto->InstanceTemplate()->SetInternalFieldCount(1);

    common::SetObjectTemplateField(locProto, "reset", reset);
    common::SetObjectTemplateField(locProto, "getGlobal", getGlobal);
    common::SetObjectTemplateLazyAccessor(locProto->InstanceTemplate(), "skippedFrames", get_skippedFrames);
    common::SetObjectTemplateLazyAccessor(locProto->InstanceTemplate(), "totalFrames", get_totalFrames);

    common::SetObjectField(target, "Video", locProto->GetFunction());
    prototype.Reset(locProto);
}

NAN_METHOD(Video::get_skippedFrames)
{
    info.GetReturnValue().Set(common::ToValue(obs::video::global().skipped_frames()));
}

NAN_METHOD(Video::get_totalFrames)
{
    info.GetReturnValue().Set(common::ToValue(obs::video::global().total_frames()));
}

NAN_METHOD(Video::reset)
{
    v8::Local<v8::Object> vi_object;

    ASSERT_GET_VALUE(info[0], vi_object);

    obs_video_info vi;
    std::string graphics_module;

    ASSERT_GET_OBJECT_FIELD(vi_object, "graphicsModule", graphics_module);
    ASSERT_GET_OBJECT_FIELD(vi_object, "fpsNum", vi.fps_num);
    ASSERT_GET_OBJECT_FIELD(vi_object, "fpsDen", vi.fps_den);
    ASSERT_GET_OBJECT_FIELD(vi_object, "baseWidth", vi.base_width);
    ASSERT_GET_OBJECT_FIELD(vi_object, "baseHeight", vi.base_height);
    ASSERT_GET_OBJECT_FIELD(vi_object, "outputWidth", vi.output_width);
    ASSERT_GET_OBJECT_FIELD(vi_object, "outputHeight", vi.output_height);
    ASSERT_GET_OBJECT_FIELD(vi_object, "outputFormat", vi.output_format);
    ASSERT_GET_OBJECT_FIELD(vi_object, "adapter", vi.adapter);
    ASSERT_GET_OBJECT_FIELD(vi_object, "gpuConversion", vi.gpu_conversion);
    ASSERT_GET_OBJECT_FIELD(vi_object, "colorspace", vi.colorspace);
    ASSERT_GET_OBJECT_FIELD(vi_object, "range", vi.range);
    ASSERT_GET_OBJECT_FIELD(vi_object, "scaleType", vi.scale_type);

    vi.graphics_module = graphics_module.c_str();

    info.GetReturnValue().Set(obs::video::reset(&vi));
}

NAN_METHOD(Video::getGlobal)
{
    Video *binding = new Video(obs::video::global());
    auto object = Video::Object::GenerateObject(binding);
    info.GetReturnValue().Set(object);
}

/* 
 * VideoEncoder
 */
Nan::Persistent<v8::FunctionTemplate> VideoEncoder::prototype = 
    Nan::Persistent<v8::FunctionTemplate>();

VideoEncoder::VideoEncoder(std::string id, std::string name, obs_data_t *settings)
 : handle(obs::video_encoder(id, name, settings, nullptr))
{
}

VideoEncoder::VideoEncoder(obs::video_encoder encoder)
 : handle(encoder)
{
}

obs::encoder VideoEncoder::GetHandle()
{
    return handle.get().get();
}

NAN_MODULE_INIT(VideoEncoder::Init)
{
    auto locProto = Nan::New<v8::FunctionTemplate>();
    locProto->Inherit(Nan::New(IEncoder::prototype));
    locProto->InstanceTemplate()->SetInternalFieldCount(1);
    locProto->SetClassName(FIELD_NAME("VideoEncoder"));
    common::SetObjectTemplateField(locProto, "types", get_types);
    common::SetObjectTemplateField(locProto, "create", create);
    common::SetObjectTemplateField(locProto, "fromName", fromName);
    common::SetObjectTemplateField(locProto->InstanceTemplate(), "getVideo", getVideo);
    common::SetObjectTemplateField(locProto->InstanceTemplate(), "setVideo", setVideo);
    common::SetObjectTemplateField(locProto->InstanceTemplate(), "getHeight", getHeight);
    common::SetObjectTemplateField(locProto->InstanceTemplate(), "getWidth", getWidth);
    common::SetObjectTemplateField(locProto->InstanceTemplate(), "setScaledSize", setScaledSize);
    common::SetObjectTemplateField(locProto->InstanceTemplate(), "getPreferredFormat", getPreferredFormat);
    common::SetObjectTemplateField(locProto->InstanceTemplate(), "setPreferredFormat", setPreferredFormat);
    common::SetObjectField(target, "VideoEncoder", locProto->GetFunction());
    prototype.Reset(locProto);
}

NAN_METHOD(VideoEncoder::get_types)
{
    auto type_list = obs::video_encoder::types();
    int count = static_cast<int>(type_list.size());

    auto array = Nan::New<v8::Array>(count);

    for (int i = 0; i < count; ++i) {
        Nan::Set(array, i, Nan::New<v8::String>(type_list[i]).ToLocalChecked());
    }

    info.GetReturnValue().Set(array);
}

NAN_METHOD(VideoEncoder::create)
{
    ASSERT_INFO_LENGTH_AT_LEAST(info, 2);
    
    std::string id, name;
    obs_data_t *settings = nullptr;

    ASSERT_GET_VALUE(info[0], id);
    ASSERT_GET_VALUE(info[1], name);

    if (info.Length() > 2)
        ASSERT_GET_VALUE(info[2], settings);

    VideoEncoder *binding = new VideoEncoder(id, name, settings);
    auto object = VideoEncoder::Object::GenerateObject(binding);
    info.GetReturnValue().Set(object);
}

NAN_METHOD(VideoEncoder::fromName)
{
    ASSERT_INFO_LENGTH(info, 1);

    std::string name;

    ASSERT_GET_VALUE(info[0], name);

    obs::video_encoder video_encoder_ref = obs::video_encoder::from_name(name);

    if (video_encoder_ref.status() != obs::video_encoder::status_type::okay) {
        info.GetReturnValue().Set(Nan::Null());
        return;
    }

    VideoEncoder *binding = new VideoEncoder(video_encoder_ref);
    auto object = VideoEncoder::Object::GenerateObject(binding);
    info.GetReturnValue().Set(object);
}


NAN_METHOD(VideoEncoder::getHeight)
{
    obs::weak<obs::video_encoder> &handle = VideoEncoder::Object::GetHandle(info.Holder());

    uint32_t height = handle.get()->height();

    info.GetReturnValue().Set(common::ToValue(height));
}

NAN_METHOD(VideoEncoder::getWidth)
{
    obs::weak<obs::video_encoder> &handle = VideoEncoder::Object::GetHandle(info.Holder());

    uint32_t width = handle.get()->width();

    info.GetReturnValue().Set(common::ToValue(width));
}

NAN_METHOD(VideoEncoder::setScaledSize)
{
    obs::weak<obs::video_encoder> &handle = VideoEncoder::Object::GetHandle(info.Holder());

    uint32_t width, height;

    ASSERT_GET_VALUE(info[0], width);
    ASSERT_GET_VALUE(info[1], height);

    handle.get()->scaled_size(width, height);
}

NAN_METHOD(VideoEncoder::getPreferredFormat)
{
    obs::weak<obs::video_encoder> &handle = VideoEncoder::Object::GetHandle(info.Holder());

    auto format = handle.get()->preferred_format();

    info.GetReturnValue().Set(common::ToValue(format));
}

NAN_METHOD(VideoEncoder::setPreferredFormat)
{
    obs::weak<obs::video_encoder> &handle = VideoEncoder::Object::GetHandle(info.Holder());

    uint32_t format;

    ASSERT_GET_VALUE(info[0], format);

    handle.get()->preferred_format(static_cast<video_format>(format));
}

NAN_METHOD(VideoEncoder::setVideo)
{
    obs::weak<obs::video_encoder> &handle = VideoEncoder::Object::GetHandle(info.Holder());

    v8::Local<v8::Object> video_obj;

    ASSERT_GET_VALUE(info[0], video_obj);

    obs::video &video = 
        Video::Object::GetHandle(video_obj);

    handle.get()->video(video);
}

NAN_METHOD(VideoEncoder::getVideo)
{
    obs::weak<obs::video_encoder> &handle = VideoEncoder::Object::GetHandle(info.Holder());

    Video *binding = new Video(handle.get()->video());
    auto ret_obj = Video::Object::GenerateObject(binding);

    info.GetReturnValue().Set(ret_obj);
}

}