const AWS = require("aws-sdk");
const ecr = new AWS.ECR();

const handledErrors = {
  AccessDeniedException: {
    statusCode: 403,
    error: {
      code: "DENIED",
      message: "requested access to the resource is denied"
    }
  },
  RepositoryNotFoundException: {
    statusCode: 404,
    error: {
      code: "NAME_UNKNOWN",
      message: "repository name not known to registry"
    }
  }
};

const actions = {
  manifests: {
    head: async (name, ref) => {
      const res = await actions.manifests.get(name, ref);
      return {
        ...res,
        body: ""
      };
    },
    get: async (name, ref) => {
      // matching is done according to https://docs.docker.com/registry/spec/api/#content-digests
      // however the algorithm regex seems broken in their docs
      // matching to a word should be enough to catch it
      if (ref.match(/^\w+:[A-Fa-f0-9]+$/)) {
        selectorObj = { imageDigest: ref };
      } else {
        selectorObj = { imageTag: ref };
      }

      const { images } = await ecr
        .batchGetImage({
          imageIds: [selectorObj],
          repositoryName: name
        })
        .promise();

      const image = images[0];
      if (!image) return { statusCode: 404, body: "{}" };
      const manifest = JSON.parse(image.imageManifest);

      return {
        statusCode: 200,
        body: image.imageManifest,
        multiValueHeaders: {
          "Content-Type": [manifest.mediaType]
        }
      };
    }
  },
  blobs: {
    get: async (name, digest) => {
      const url = await ecr
        .getDownloadUrlForLayer({
          repositoryName: name,
          layerDigest: digest
        })
        .promise();

      return {
        statusCode: 307,
        headers: {
          Location: url.downloadUrl,
          "Docker-Content-Digest": url.layerDigest
        }
      };
    }
  }
};

exports.handler = async event => {
  console.log(JSON.stringify(event));
  const context = event.requestContext;
  const segments = context.path.split(/\//);
  const [action, reference] = segments.slice(segments.length - 2);
  const name = segments.slice(2, segments.length - 2).join("/");

  let fn;

  try {
    fn = actions[action][context.httpMethod.toLowerCase()];
  } catch (e) {
    return { statusCode: 404 };
  }

  return fn(name, reference).catch(e => {
    if (Object.keys(handledErrors).includes(e.name)) {
      const errResponse = handledErrors[e.name];
      return {
        statusCode: errResponse.statusCode,
        body: JSON.stringify({
          errors: [errResponse.error]
        })
      };
    } else {
      console.log(e.toString ? e.toString() : e);
      throw e;
    }
  });
};
