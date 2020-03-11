TEMPLATE=dist/aws-ecr-public.template.json

build:
	mkdir -p dist
	cfn-include -t -m serverless.template.yml > $(TEMPLATE)

test: build
	aws cloudformation deploy --template-file $(TEMPLATE) --stack-name aws-ecr-public --capabilities CAPABILITY_IAM

publish: build
	aws s3 cp --acl public-read dist/aws-ecr-public.template.json s3://monken/aws-ecr-public/v1.1.1/template.json

clean:
	rm -rf dist
	aws cloudformation delete-stack --stack-name aws-ecr-public
