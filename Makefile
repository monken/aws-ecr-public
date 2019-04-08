TEMPLATE=dist/aws-ecr-public.template.json

build:
	mkdir -p dist
	cfn-include -t -m serverless.template.yml > $(TEMPLATE)

test: build
	aws cloudformation deploy --template-file $(TEMPLATE) --stack-name isaac-ecr-test --capabilities CAPABILITY_IAM

clean:
	rm -rf dist
	aws cloudformation delete-stack --stack-name aws-ecr-public
